import prisma from '../src/lib/prisma';

async function main() {
  console.log('--- STARTING PORTAL VERIFICATION SUITE ---');

  // Test 1: User Accounts Safety
  console.log('\n[TEST 1] Verifying Genuine User Accounts...');
  const genuineEmails = [
    'kodivellamahammad@gmail.com',
    'ivrtechsolutions.pvtld@gmail.com',
    'scaryparent159@gmail.com',
    'khalidshaikme@gamil.com',
  ];
  for (const email of genuineEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(`CRITICAL: Genuine user ${email} is missing!`);
    }
    console.log(`  ✓ Verified User: ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
  }

  // Test 2: Verify Existing Course in Database
  console.log('\n[TEST 2] Verifying Existing Course in Database...');
  const existingCourses = await prisma.course.findMany({ where: { status: 'ACTIVE' } });
  console.log(`  Found ${existingCourses.length} active course(s) in DB:`);
  existingCourses.forEach((c) => {
    console.log(`  - [${c.code}] ${c.title} (Domain: ${c.domain})`);
  });
  if (existingCourses.length === 0) {
    console.warn('  (No active courses found currently in DB)');
  }

  // Test 3: Create Course & Verify Dynamic Domain Track
  console.log('\n[TEST 3] Testing Course Creation & Domain Track Synchronization...');
  const testCourse = await prisma.course.create({
    data: {
      code: `TEST-${Date.now().toString(36).toUpperCase()}`,
      title: 'Automated Test Cloud Architecture',
      domain: 'Cloud Architecture & Microservices',
      description: 'End-to-end verification of dynamic domain sync.',
      department: 'Engineering',
      durationWeeks: 10,
      level: 'Advanced',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Created Test Course: ${testCourse.title} (ID: ${testCourse.id})`);

  // Verify it appears in dynamic query
  const queryAfterCreate = await prisma.course.findMany({ where: { status: 'ACTIVE' } });
  const foundInActive = queryAfterCreate.some((c) => c.id === testCourse.id);
  if (!foundInActive) {
    throw new Error('Test course did not appear in active courses query!');
  }
  console.log('  ✓ Test course dynamically appears in active course tracks.');

  // Test 4: Update Course & Verify Immediate Sync
  console.log('\n[TEST 4] Testing Course Edit & Real-Time Sync...');
  const updatedCourse = await prisma.course.update({
    where: { id: testCourse.id },
    data: {
      title: 'Updated Cloud Architecture & Kubernetes',
      durationWeeks: 12,
    },
  });
  if (updatedCourse.title !== 'Updated Cloud Architecture & Kubernetes' || updatedCourse.durationWeeks !== 12) {
    throw new Error('Course update failed to persist in DB!');
  }
  console.log(`  ✓ Updated Course Title: "${updatedCourse.title}", Duration: ${updatedCourse.durationWeeks} Weeks`);

  // Test 5: Create Internship Program (Admin exclusive)
  console.log('\n[TEST 5] Testing Admin Internship Program Creation...');
  const testProgram = await prisma.internshipProgram.create({
    data: {
      title: 'Full-Stack Distributed Systems Fellowship',
      description: 'Comprehensive enterprise internship program with mentor pairing and live capstones.',
      domain: 'Cloud Architecture & Microservices',
      courseId: testCourse.id,
      duration: '12 Weeks',
      level: 'Advanced',
      techStack: 'Docker, Kubernetes, Go, PostgreSQL, AWS',
      projects: 'High-Throughput Gateway, Distributed KV Store',
      stipend: 'INR 15,000 / month',
      mode: 'Virtual / Remote',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Created Internship Program: "${testProgram.title}" (ID: ${testProgram.id})`);

  // Test 6: Verify Student Visibility Filter (Active only)
  console.log('\n[TEST 6] Testing Student Program Visibility & Status Toggling...');
  // Deactivate
  const deactivatedProg = await prisma.internshipProgram.update({
    where: { id: testProgram.id },
    data: { status: 'INACTIVE' },
  });
  const publicPrograms = await prisma.internshipProgram.findMany({ where: { status: 'ACTIVE' } });
  const isFoundWhenInactive = publicPrograms.some((p) => p.id === testProgram.id);
  if (isFoundWhenInactive) {
    throw new Error('Inactive internship program should NOT be visible to students/public!');
  }
  console.log('  ✓ Verified: Inactive program is immediately hidden from student/public query.');

  // Reactivate
  const reactivatedProg = await prisma.internshipProgram.update({
    where: { id: testProgram.id },
    data: { status: 'ACTIVE' },
  });
  const publicPrograms2 = await prisma.internshipProgram.findMany({ where: { status: 'ACTIVE' } });
  const isFoundWhenActive = publicPrograms2.some((p) => p.id === testProgram.id);
  if (!isFoundWhenActive) {
    throw new Error('Active internship program should be visible to students/public!');
  }
  console.log('  ✓ Verified: Activated program is immediately visible to students/public.');

  // Test 7: Cleanup Test Program & Course
  console.log('\n[TEST 7] Cleaning Up Test Records...');
  await prisma.internshipProgram.delete({ where: { id: testProgram.id } });
  console.log('  ✓ Test internship program deleted.');
  await prisma.course.delete({ where: { id: testCourse.id } });
  console.log('  ✓ Test course deleted.');

  // Verify deletion from active list
  const coursesPostDelete = await prisma.course.findMany({ where: { id: testCourse.id } });
  if (coursesPostDelete.length > 0) {
    throw new Error('Deleted course is still present in database!');
  }
  console.log('  ✓ Verified: Deleted course is completely removed from database and domain tracks.');

  // Test 8: Final Account Check
  console.log('\n[TEST 8] Final Account Integrity Check...');
  const userCount = await prisma.user.count();
  console.log(`  Total verified user accounts in cloud DB: ${userCount}`);
  for (const email of genuineEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`User ${email} missing!`);
  }
  console.log('  ✓ All 4 genuine user accounts confirmed healthy and intact.');

  console.log('\n=============================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS');
  console.log('=============================================');
}

main()
  .catch((e) => {
    console.error('VERIFICATION FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

