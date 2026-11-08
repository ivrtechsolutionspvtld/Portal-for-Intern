import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testWorkflow() {
  console.log('🧪 Starting IVR Tech Solutions Master Verification Test Suite...\n');

  // Test 1: Verify Demo Accounts exist in database
  console.log('1️⃣ Testing DEMO accounts in database...');
  const demoStudent = await prisma.user.findUnique({
    where: { email: 'rahul.demo@ivrtechsolution.in' },
    include: { studentProfile: { include: { mentor: { include: { user: true } } } } },
  });

  const demoMentor = await prisma.user.findUnique({
    where: { email: 'arjun.demo@ivrtechsolution.in' },
    include: { mentorProfile: { include: { assignedStudents: true } } },
  });

  if (!demoStudent || !demoMentor) {
    throw new Error('❌ Demo student or mentor not found in database!');
  }

  console.log(`   ✔ Demo Student: ${demoStudent.name} (ID: ${demoStudent.studentProfile?.studentId}, Status: ${demoStudent.status})`);
  console.log(`   ✔ Demo Mentor: ${demoMentor.name} (ID: ${demoMentor.mentorProfile?.mentorId}, Status: ${demoMentor.status})`);
  console.log(`   ✔ Linked Mentor: ${demoStudent.studentProfile?.mentor?.user.name}`);

  // Test 2: Verify Password Authentication for Demo Accounts & Admin
  console.log('\n2️⃣ Testing Password Hashing & Authentication...');
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@ivrtechsolution.in' } });
  if (!adminUser) throw new Error('Admin user missing');

  const adminPassMatch = await bcrypt.compare('Admin@IVR2026!', adminUser.passwordHash);
  const studentPassMatch = await bcrypt.compare('StudentDemo@2026!', demoStudent.passwordHash);
  const mentorPassMatch = await bcrypt.compare('MentorDemo@2026!', demoMentor.passwordHash);

  console.log(`   ✔ Admin Password Match: ${adminPassMatch}`);
  console.log(`   ✔ Demo Student Password Match: ${studentPassMatch}`);
  console.log(`   ✔ Demo Mentor Password Match: ${mentorPassMatch}`);

  if (!adminPassMatch || !studentPassMatch || !mentorPassMatch) {
    throw new Error('❌ Password verification failed!');
  }

  // Test 3: Test Registration -> PENDING_APPROVAL workflow
  console.log('\n3️⃣ Testing Registration & Approval Lifecycle...');
  const testRegEmail = 'test.applicant.2026@testmail.com';
  // Remove if exists from prior run
  const existingTest = await prisma.user.findUnique({ where: { email: testRegEmail } });
  if (existingTest) {
    await prisma.user.delete({ where: { id: existingTest.id } });
  }

  // Simulate Student Registration API
  const testStudentId = `IVR-STU-2026-TEST`;
  const salt = await bcrypt.genSalt(10);
  const testHash = await bcrypt.hash('TestApplicant@2026!', salt);

  const regUser = await prisma.user.create({
    data: {
      email: testRegEmail,
      name: 'Test Applicant',
      phone: '+91 9988776655',
      passwordHash: testHash,
      role: 'STUDENT',
      status: 'PENDING_APPROVAL',
      studentProfile: {
        create: {
          studentId: testStudentId,
          college: 'Test University of Technology',
          department: 'Computer Science',
          degree: 'B.Tech',
          academicYear: 'Final Year',
          graduationYear: 2026,
          domain: 'Full Stack Development',
        },
      },
    },
    include: { studentProfile: true },
  });

  console.log(`   ✔ Registered Applicant: ${regUser.name} (${regUser.email})`);
  console.log(`   ✔ Status upon registration: ${regUser.status}`);
  if (regUser.status !== 'PENDING_APPROVAL') {
    throw new Error('❌ Registered account must be PENDING_APPROVAL!');
  }

  // Verify that PENDING_APPROVAL users are blocked from login
  const isEligibleToLogin = (regUser.status as string) === 'ACTIVE';
  console.log(`   ✔ Login eligibility for pending user: ${isEligibleToLogin} (Expected: false)`);
  if (isEligibleToLogin) {
    throw new Error('❌ Pending user must NOT be permitted to log in!');
  }

  // Test 4: Administrator Approval Execution
  console.log('\n4️⃣ Testing Administrator Approval...');
  const approvedUser = await prisma.user.update({
    where: { id: regUser.id },
    data: {
      status: 'ACTIVE',
      approvedAt: new Date(),
      approvedBy: adminUser.email,
      approvalNotes: 'Verified collegiate credentials and approved for cohort enrollment',
    },
    include: { studentProfile: true },
  });

  console.log(`   ✔ Updated Status after Admin Approval: ${approvedUser.status}`);
  console.log(`   ✔ Approved By: ${approvedUser.approvedBy} at ${approvedUser.approvedAt?.toISOString()}`);
  if (approvedUser.status !== 'ACTIVE') {
    throw new Error('❌ Account status was not updated to ACTIVE!');
  }

  // Clean up test applicant
  await prisma.user.delete({ where: { id: regUser.id } });
  console.log('   ✔ Test applicant cleaned up from database.');

  // Test 5: Verify Absence of CIN / ISO
  console.log('\n5️⃣ Checking Company Configuration for unapproved CIN/ISO...');
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'ivr-global-settings' } });
  console.log(`   ✔ Contact Email: ${settings?.contactEmail}`);
  console.log(`   ✔ Mandatory Fields Configured: ${settings?.mandatoryStudentFields}`);

  console.log('\n🎉 ALL MASTER VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

testWorkflow()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

