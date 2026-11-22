import prisma from '../src/lib/prisma';
import { signToken, COOKIE_NAME } from '../src/lib/auth';

// Helper to simulate Next.js Request with auth cookie & header
function createAuthRequest(url: string, method: string, token: string, body?: any): Request {
  const headers: Record<string, string> = {
    'cookie': `${COOKIE_NAME}=${token}`,
    'authorization': `Bearer ${token}`,
    'content-type': 'application/json',
  };
  const init: RequestInit = {
    method,
    headers,
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

async function runMilestoneVerification() {
  console.log('\n=============================================================');
  console.log('   IVR TECH SOLUTIONS - MENTOR ACCESS & IDOR SECURITY TEST   ');
  console.log('=============================================================\n');

  // 1. Fetch genuine users
  const adminUser = await prisma.user.findFirst({
    where: { email: 'ivrtechsolutions.pvtld@gmail.com' },
  });
  const mentor1User = await prisma.user.findFirst({
    where: { email: 'ivrtechsolutions.mentor100@gmail.com' },
    include: { mentorProfile: true },
  });
  const mentor2User = await prisma.user.findFirst({
    where: { email: 'ivrtechsolutions.mentor101@gmail.com' },
    include: { mentorProfile: true },
  });
  const studentUser = await prisma.user.findFirst({
    where: { email: 'khalidshaikme@gmail.com' },
    include: { studentProfile: true },
  });

  if (!adminUser || !mentor1User?.mentorProfile || !mentor2User?.mentorProfile || !studentUser?.studentProfile) {
    throw new Error('Required test users (Admin, Mentor 1, Mentor 2, Student) missing from database.');
  }

  console.log(`[INIT] Admin Account:     ${adminUser.name} (${adminUser.email})`);
  console.log(`[INIT] Mentor 1 Account:  ${mentor1User.name} (${mentor1User.email}) [ID: ${mentor1User.mentorProfile.id}]`);
  console.log(`[INIT] Mentor 2 Account:  ${mentor2User.name} (${mentor2User.email}) [ID: ${mentor2User.mentorProfile.id}]`);
  console.log(`[INIT] Student Account:   ${studentUser.name} (${studentUser.email}) [ID: ${studentUser.studentProfile.id}]`);

  // Generate auth tokens
  const adminToken = signToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: adminUser.name,
  });
  const mentor1Token = signToken({
    userId: mentor1User.id,
    email: mentor1User.email,
    role: mentor1User.role,
    name: mentor1User.name,
  });
  const mentor2Token = signToken({
    userId: mentor2User.id,
    email: mentor2User.email,
    role: mentor2User.role,
    name: mentor2User.name,
  });

  // Dynamic import of API Route handlers
  const adminAllocRoute = await import('../src/app/api/admin/allocation/route');
  const mentorStudentsRoute = await import('../src/app/api/mentor/students/route');
  const mentorStudentDetailRoute = await import('../src/app/api/mentor/students/[id]/route');
  const mentorGradeRoute = await import('../src/app/api/mentor/submissions/grade/route');
  const mentorAttendanceRoute = await import('../src/app/api/mentor/attendance/route');

  // =========================================================================
  // TEST STEP 1: Admin allocates Khalid Shaik to Mentor 1 (ADHWITH KRISHNA)
  // =========================================================================
  console.log('\n--- TEST STEP 1: Admin allocates Student to Mentor 1 ---');
  const allocReq1 = createAuthRequest(
    'http://localhost:3000/api/admin/allocation',
    'POST',
    adminToken,
    {
      studentProfileId: studentUser.studentProfile.id,
      newMentorId: mentor1User.mentorProfile.id,
      reason: 'Security Verification: Allocating to Mentor 1',
    }
  );
  const allocRes1 = await adminAllocRoute.POST(allocReq1);
  const allocJson1 = await allocRes1.json();

  if (allocRes1.status !== 200 || !allocJson1.success) {
    throw new Error(`Step 1 Failed: Allocation error: ${JSON.stringify(allocJson1)}`);
  }
  console.log(`[PASS] Student assigned to Mentor 1 successfully: status ${allocRes1.status}`);

  // Verify DB state
  const updatedStudent1 = await prisma.studentProfile.findUnique({
    where: { id: studentUser.studentProfile.id },
  });
  if (updatedStudent1?.mentorId !== mentor1User.mentorProfile.id) {
    throw new Error(`Step 1 DB Mismatch: Expected mentorId ${mentor1User.mentorProfile.id}, got ${updatedStudent1?.mentorId}`);
  }
  console.log(`[PASS] DB Verified: studentProfile.mentorId === mentor1Profile.id`);

  // Verify MentorAssignmentHistory
  const latestHistory = await prisma.mentorAssignmentHistory.findFirst({
    where: { studentId: studentUser.studentProfile.id },
    orderBy: { timestamp: 'desc' },
  });
  if (!latestHistory || latestHistory.mentorId !== mentor1User.mentorProfile.id) {
    throw new Error(`Step 1 History Mismatch: No history recorded for Mentor 1`);
  }
  console.log(`[PASS] Audit Trail Verified: MentorAssignmentHistory logged action "${latestHistory.action}" by "${latestHistory.assignedBy}"`);

  // =========================================================================
  // TEST STEP 2: Mentor 1 Logs In & Views Assigned Student
  // =========================================================================
  console.log('\n--- TEST STEP 2: Mentor 1 retrieves assigned student list & 9-tab profile ---');
  const m1ListReq = createAuthRequest('http://localhost:3000/api/mentor/students', 'GET', mentor1Token);
  const m1ListRes = await mentorStudentsRoute.GET(m1ListReq);
  const m1ListJson = await m1ListRes.json();

  if (m1ListRes.status !== 200) {
    throw new Error(`Step 2 Failed: Mentor 1 list query returned ${m1ListRes.status}`);
  }
  const hasKhalid = m1ListJson.students?.some((s: any) => s.id === studentUser.studentProfile!.id);
  if (!hasKhalid) {
    throw new Error(`Step 2 Failed: Student Khalid Shaik not in Mentor 1 student list`);
  }
  console.log(`[PASS] Mentor 1 assigned list includes student: "${studentUser.name}" (${studentUser.email})`);

  // Mentor 1 calls 9-tab student profile API
  const m1DetailReq = createAuthRequest(
    `http://localhost:3000/api/mentor/students/${studentUser.studentProfile.id}`,
    'GET',
    mentor1Token
  );
  const m1DetailRes = await mentorStudentDetailRoute.GET(m1DetailReq, {
    params: Promise.resolve({ id: studentUser.studentProfile.id }),
  });
  const m1DetailJson = await m1DetailRes.json();

  if (m1DetailRes.status !== 200 || !m1DetailJson.success) {
    throw new Error(`Step 2 Detail Failed: Status ${m1DetailRes.status}, data: ${JSON.stringify(m1DetailJson)}`);
  }
  console.log(`[PASS] Mentor 1 accessed student 9-tab details successfully (HTTP 200):`);
  console.log(`       - Tab 1 Overview: Domain "${m1DetailJson.student.domain}", Attendance: ${m1DetailJson.student.attendance.percentage}%`);
  console.log(`       - Tab 2 Personal: College "${m1DetailJson.student.personalDetails.college}", Degree: ${m1DetailJson.student.personalDetails.degree || 'B.Tech'}`);
  console.log(`       - Tab 3 Attendance: Records count ${m1DetailJson.student.attendance.records.length}, Status: ${m1DetailJson.student.attendance.status}`);

  // Mentor 1 adds confidential note (Tab 8)
  const m1NoteReq = createAuthRequest(
    `http://localhost:3000/api/mentor/students/${studentUser.studentProfile.id}`,
    'POST',
    mentor1Token,
    {
      note: 'Verified student attendance and technical acumen in VLSI system design.',
      category: 'PERFORMANCE',
    }
  );
  const m1NoteRes = await mentorStudentDetailRoute.POST(m1NoteReq, {
    params: Promise.resolve({ id: studentUser.studentProfile.id }),
  });
  const m1NoteJson = await m1NoteRes.json();
  if (m1NoteRes.status !== 200 || !m1NoteJson.success) {
    throw new Error(`Step 2 Note Failed: Status ${m1NoteRes.status}`);
  }
  console.log(`[PASS] Mentor 1 saved private note for assigned student (HTTP 200)`);

  // =========================================================================
  // TEST STEP 3: Mentor 2 Attempts Access (Strict IDOR Protection Enforcement)
  // =========================================================================
  console.log('\n--- TEST STEP 3: Mentor 2 attempts unauthorized access (IDOR Defense) ---');
  
  // 3a. Mentor 2 student list should NOT contain Khalid
  const m2ListReq = createAuthRequest('http://localhost:3000/api/mentor/students', 'GET', mentor2Token);
  const m2ListRes = await mentorStudentsRoute.GET(m2ListReq);
  const m2ListJson = await m2ListRes.json();
  const m2HasKhalid = m2ListJson.students?.some((s: any) => s.id === studentUser.studentProfile!.id);
  if (m2HasKhalid) {
    throw new Error(`Security Failure: Mentor 2 sees student assigned to Mentor 1 in student list!`);
  }
  console.log(`[PASS] Mentor 2 student roster is properly scoped: does NOT contain Mentor 1's student.`);

  // 3b. Mentor 2 attempts to directly call /api/mentor/students/[khalidId]
  const m2DetailReq = createAuthRequest(
    `http://localhost:3000/api/mentor/students/${studentUser.studentProfile.id}`,
    'GET',
    mentor2Token
  );
  const m2DetailRes = await mentorStudentDetailRoute.GET(m2DetailReq, {
    params: Promise.resolve({ id: studentUser.studentProfile.id }),
  });
  const m2DetailJson = await m2DetailRes.json();

  if (m2DetailRes.status !== 403) {
    throw new Error(`CRITICAL SECURITY FAILURE: Mentor 2 bypassed IDOR on student profile! Expected 403, got ${m2DetailRes.status}`);
  }
  console.log(`[PASS] IDOR Protection Confirmed: Mentor 2 blocked from viewing Mentor 1's student!`);
  console.log(`       HTTP Status: ${m2DetailRes.status} Forbidden`);
  console.log(`       Error Message: "${m2DetailJson.error}"`);

  // 3c. Mentor 2 attempts to add note to Khalid
  const m2NoteReq = createAuthRequest(
    `http://localhost:3000/api/mentor/students/${studentUser.studentProfile.id}`,
    'POST',
    mentor2Token,
    { note: 'Unauthorized note attempt', category: 'GENERAL' }
  );
  const m2NoteRes = await mentorStudentDetailRoute.POST(m2NoteReq, {
    params: Promise.resolve({ id: studentUser.studentProfile.id }),
  });
  if (m2NoteRes.status !== 403) {
    throw new Error(`CRITICAL SECURITY FAILURE: Mentor 2 added note to unassigned student! Status: ${m2NoteRes.status}`);
  }
  console.log(`[PASS] IDOR Protection Confirmed: Mentor 2 blocked from adding note to unassigned student (HTTP 403 Forbidden).`);

  // 3d. Mentor 2 attempts to mark attendance for Khalid
  const m2AttReq = createAuthRequest(
    'http://localhost:3000/api/mentor/attendance',
    'POST',
    mentor2Token,
    {
      date: new Date().toISOString(),
      records: [{ studentId: studentUser.studentProfile.id, status: 'PRESENT' }],
    }
  );
  const m2AttRes = await mentorAttendanceRoute.POST(m2AttReq);
  const m2AttJson = await m2AttRes.json();
  if (m2AttRes.status !== 403) {
    throw new Error(`CRITICAL SECURITY FAILURE: Mentor 2 marked attendance for unassigned student! Status: ${m2AttRes.status}`);
  }
  console.log(`[PASS] IDOR Protection Confirmed: Mentor 2 blocked from marking attendance for unassigned student (HTTP 403 Forbidden).`);

  // =========================================================================
  // TEST STEP 4: Genuine Accounts Integrity & Isolation
  // =========================================================================
  console.log('\n--- TEST STEP 4: Genuine Accounts Integrity Verification ---');
  const genuineEmails = [
    'kodivellamahammad@gmail.com',
    'ivrtechsolutions.pvtld@gmail.com',
    'ivrtechsolutions.mentor100@gmail.com',
    'khalidshaikme@gmail.com',
  ];
  const genuineUsers = await prisma.user.findMany({
    where: { email: { in: genuineEmails } },
  });

  if (genuineUsers.length !== 4) {
    throw new Error(`Integrity Check Failed: Expected 4 genuine accounts, found ${genuineUsers.length}`);
  }

  for (const u of genuineUsers) {
    if (u.status !== 'ACTIVE') {
      throw new Error(`Integrity Check Failed: Account ${u.email} is not ACTIVE!`);
    }
    console.log(`[PASS] Verified Account: ${u.name} (${u.email}) [Role: ${u.role}, Status: ${u.status}]`);
  }

  console.log('\n=============================================================');
  console.log('   ALL MILESTONE 1 & 2 SECURITY & ACCESS CONTROLS VERIFIED   ');
  console.log('   RESULT: 100% PASSED - STRICT IDOR DEFENSE ENFORCED        ');
  console.log('=============================================================\n');
}

runMilestoneVerification()
  .catch((err) => {
    console.error('\nVerification Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

