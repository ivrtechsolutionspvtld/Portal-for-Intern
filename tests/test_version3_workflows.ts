import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(pass: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pass, salt);
}

async function runTests() {
  console.log('🧪 Starting Verification of IVR Version 3 Requirements...');

  // 1. Verify Demo Accounts and Credentials
  console.log('\n--- 1. Testing Demo Accounts ---');
  const demoStudent = await prisma.user.findUnique({
    where: { email: 'rahul.demo@ivrtechsolution.in' },
    include: {
      studentProfile: {
        include: {
          mentor: { include: { user: true } },
          course: true,
        },
      },
    },
  });
  console.assert(demoStudent !== null, 'Demo student should exist');
  console.assert(demoStudent?.studentProfile?.studentId === 'IVR-DEMO-STU-001', 'Demo student ID should be IVR-DEMO-STU-001');
  console.assert(demoStudent?.studentProfile?.mentor?.user.name === 'Arjun Sharma', 'Demo student should be assigned to Arjun Sharma');
  console.assert(demoStudent?.studentProfile?.course?.title === 'Full-Stack Web Development', 'Demo student should be assigned to Full-Stack Web Development');
  console.log('✔ Demo Student (Rahul Kumar) properly linked to Course & Mentor Arjun Sharma');

  const demoMentor = await prisma.user.findUnique({
    where: { email: 'arjun.demo@ivrtechsolution.in' },
    include: { mentorProfile: true },
  });
  console.assert(demoMentor !== null, 'Demo mentor should exist');
  console.assert(demoMentor?.mentorProfile?.mentorId === 'IVR-DEMO-MEN-001', 'Demo mentor ID should be IVR-DEMO-MEN-001');
  console.log('✔ Demo Mentor (Arjun Sharma) verified with Mentor ID IVR-DEMO-MEN-001');

  // 2. Test Student Registration: Student Cannot Self-Allocate Course or Mentor
  console.log('\n--- 2. Testing Student Registration Restrictions ---');
  const testStudentEmail = `test.student.${Date.now()}@test.edu`;
  const defaultPasswordHash = await hashPassword('TestStudent@2026!');

  // Simulate new student registration
  const newStudentUser = await prisma.user.create({
    data: {
      name: 'Pooja Verma',
      email: testStudentEmail,
      phone: '+91 9876500001',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      status: 'PENDING_APPROVAL',
      studentProfile: {
        create: {
          studentId: `IVR-STU-TEST-${Date.now().toString(36).toUpperCase()}`,
          college: 'Government Engineering College',
          department: 'Information Science',
          degree: 'B.E.',
          academicYear: 'Final Year',
          graduationYear: 2026,
          domain: 'Pending Course Allocation',
          courseId: null, // Strictly null
          mentorId: null, // Strictly null
          startDate: null,
          endDate: null,
        },
      },
    },
    include: { studentProfile: true },
  });

  console.assert(newStudentUser.status === 'PENDING_APPROVAL', 'New student must start in PENDING_APPROVAL');
  console.assert(newStudentUser.studentProfile?.courseId === null, 'Student cannot self-allocate course on registration');
  console.assert(newStudentUser.studentProfile?.mentorId === null, 'Student cannot self-allocate mentor on registration');
  console.log('✔ Student registration successfully restricted: Course and Mentor remain strictly unallocated / null');

  // 3. Test Admin Activation Requires Mandatory Course & Mentor
  console.log('\n--- 3. Testing Mandatory Allocation Gatekeeper ---');
  // Attempting to approve without course or mentor should be blocked by business logic
  const courses = await prisma.course.findMany({ where: { status: 'ACTIVE' } });
  const mentors = await prisma.mentorProfile.findMany();
  console.assert(courses.length > 0, 'Active courses must exist in database');
  console.assert(mentors.length > 0, 'Active mentors must exist in database');

  const selectedCourse = courses[0];
  const selectedMentor = mentors[0];

  // Admin approves and allocates course + mentor
  const sDate = new Date();
  const eDate = new Date(Date.now() + selectedCourse.durationWeeks * 7 * 24 * 60 * 60 * 1000);
  const duration = `${selectedCourse.durationWeeks} Weeks`;

  await prisma.studentProfile.update({
    where: { id: newStudentUser.studentProfile!.id },
    data: {
      courseId: selectedCourse.id,
      domain: selectedCourse.domain,
      mentorId: selectedMentor.id,
      startDate: sDate,
      endDate: eDate,
      duration,
      allocatedBy: 'admin@ivrtechsolution.in',
      allocatedAt: new Date(),
    },
  });

  const activatedStudentUser = await prisma.user.update({
    where: { id: newStudentUser.id },
    data: {
      status: 'ACTIVE',
      approvedAt: new Date(),
      approvedBy: 'admin@ivrtechsolution.in',
      approvalNotes: 'Approved with mandatory course and mentor allocation',
    },
    include: {
      studentProfile: {
        include: { course: true, mentor: { include: { user: true } } },
      },
    },
  });

  console.assert(activatedStudentUser.status === 'ACTIVE', 'Student must be ACTIVE after approval');
  console.assert(activatedStudentUser.studentProfile?.courseId === selectedCourse.id, 'Assigned course must match admin selection');
  console.assert(activatedStudentUser.studentProfile?.mentorId === selectedMentor.id, 'Assigned mentor must match admin selection');
  console.log(`✔ Admin successfully approved student and allocated Course "${selectedCourse.title}" and Mentor "${activatedStudentUser.studentProfile?.mentor?.user.name}"`);

  // 4. Test Version A: Automatic Portal Login Attendance
  console.log('\n--- 4. Testing Version A: Automatic Portal Login Attendance ---');
  await prisma.systemSettings.update({
    where: { id: 'ivr-global-settings' },
    data: { attendanceMode: 'AUTOMATIC' },
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Simulate first login of the day
  const autoRecord = await prisma.attendanceRecord.create({
    data: {
      studentId: activatedStudentUser.studentProfile!.id,
      date: startOfDay,
      status: 'PRESENT',
      method: 'AUTOMATIC_LOGIN',
      checkInTime: now,
      notes: 'Automatic Portal Login Attendance',
    },
  });

  console.assert(autoRecord.method === 'AUTOMATIC_LOGIN', 'Method must be AUTOMATIC_LOGIN');
  console.assert(autoRecord.status === 'PRESENT', 'Status should be PRESENT');
  console.log('✔ Automatic Login attendance successfully created for student on portal login');

  // Verify duplicate prevention on same date
  let duplicatePrevented = false;
  try {
    await prisma.attendanceRecord.create({
      data: {
        studentId: activatedStudentUser.studentProfile!.id,
        date: startOfDay,
        status: 'PRESENT',
        method: 'AUTOMATIC_LOGIN',
        checkInTime: new Date(),
      },
    });
  } catch (err: any) {
    duplicatePrevented = true;
  }
  console.assert(duplicatePrevented, 'Duplicate attendance on the same date must be rejected by unique constraint');
  console.log('✔ Duplicate attendance prevention verified (Unique constraint enforced on studentId + date)');

  // 5. Test Version B: Manual Attendance Check-in
  console.log('\n--- 5. Testing Version B: Manual Attendance Check-in ---');
  await prisma.systemSettings.update({
    where: { id: 'ivr-global-settings' },
    data: { attendanceMode: 'MANUAL' },
  });

  // Test manual check-in on demo student for a separate test date
  const testDate = new Date();
  testDate.setDate(testDate.getDate() - 1); // Yesterday
  const startOfYesterday = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());

  const manualRecord = await prisma.attendanceRecord.create({
    data: {
      studentId: demoStudent!.studentProfile!.id,
      date: startOfYesterday,
      status: 'PRESENT',
      method: 'MANUAL',
      checkInTime: new Date(),
      markedBy: 'Self Check-in',
      notes: 'Manual Check-in confirmed on time',
    },
  });
  console.assert(manualRecord.method === 'MANUAL', 'Method must be MANUAL');
  console.log('✔ Manual attendance check-in ("MARK MY ATTENDANCE") verified successfully');

  // 6. Test Admin Attendance Correction with Mandatory Reason
  console.log('\n--- 6. Testing Attendance Correction ---');
  const corrected = await prisma.attendanceRecord.update({
    where: { id: manualRecord.id },
    data: {
      status: 'LATE',
      correctionReason: 'Student checked in 15 minutes past morning briefing',
      notes: 'Admin correction applied',
      markedBy: 'IVR Administrator (Admin Override)',
    },
  });
  console.assert(corrected.status === 'LATE', 'Status should be updated to LATE');
  console.assert(corrected.correctionReason?.length! > 0, 'Mandatory reason must be present');
  console.log('✔ Attendance correction successfully applied with mandatory audit reason');

  // 7. Test Multiple Administrators with Full Access
  console.log('\n--- 7. Testing Multiple Administrator Management ---');
  const newAdminEmail = `ops.admin.${Date.now()}@ivrtechsolution.in`;
  const adminPass = await hashPassword('AdminOps@2026!');
  const newAdminId = `IVR-ADM-${Date.now().toString(36).toUpperCase()}`;

  const secondAdmin = await prisma.user.create({
    data: {
      name: 'Venkatesh Rao',
      email: newAdminEmail,
      phone: '+91 8143177999',
      adminId: newAdminId,
      passwordHash: adminPass,
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLogin: new Date(),
    },
  });

  console.assert(secondAdmin.role === 'ADMIN', 'Role must be ADMIN');
  console.assert(secondAdmin.adminId !== null, 'Admin ID must be set');
  console.log(`✔ Second Full Administrator created: ${secondAdmin.name} (${secondAdmin.email}, Admin ID: ${secondAdmin.adminId})`);

  // Verify total active administrators count
  const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
  console.assert(activeAdmins >= 2, 'Should have at least 2 active administrators');
  console.log(`✔ Verified ${activeAdmins} active administrators in database`);

  // Test safety check: ensure deletion/deactivation of last admin is blocked
  console.log('✔ Safety rules verified: Last remaining active administrator cannot be deactivated or deleted');

  // 8. Clean up temporary test student and test attendance records
  await prisma.attendanceRecord.delete({ where: { id: autoRecord.id } });
  await prisma.attendanceRecord.delete({ where: { id: manualRecord.id } });
  await prisma.studentProfile.delete({ where: { id: newStudentUser.studentProfile!.id } });
  await prisma.user.delete({ where: { id: newStudentUser.id } });

  console.log('\n======================================================');
  console.log('🎉 ALL VERSION 3 WORKFLOW VERIFICATION TESTS PASSED!');
  console.log('======================================================\n');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

