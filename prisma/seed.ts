import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(pass: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pass, salt);
}

async function main() {
  console.log('🚀 Resetting & Initializing IVR TECH SOLUTIONS PRIVATE LIMITED Database...');

  // 1. Clean all demonstration and sample data across the entire schema
  await prisma.paymentTransaction.deleteMany();
  await prisma.paymentOrder.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.projectSubmission.deleteMany();
  await prisma.project.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.courseProgress.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  console.log('✔ All demo students, mentors, applications, and sample records cleared.');

  // 2. System Settings with official company contact information
  await prisma.systemSettings.create({
    data: {
      id: 'ivr-global-settings',
      internshipDurationDays: 60,
      minAttendancePercent: 80.0,
      minProjectScore: 70,
      registrationFeeINR: 499.0,
      programFeeINR: 4999.0,
      currency: 'INR',
      razorpayKeyId: 'rzp_test_ivr2026enterprise',
      contactEmail: 'admin@ivrtechsolution.in',
      contactPhone: '+91 8143177907',
      officeAddress: 'Remote-First Operations (Pan-India)',
    },
  });

  // 3. Genuine Administrator Account(s)
  const adminPass = await hashPassword('Admin@IVR2026!');
  
  // Primary Administrator
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ivrtechsolution.in',
      passwordHash: adminPass,
      name: 'IVR Administrator',
      role: 'ADMIN',
      phone: '+91 8143177907',
      status: 'ACTIVE',
    },
  });

  // Also maintain alias admin to prevent breaking any legacy auth
  await prisma.user.create({
    data: {
      email: 'admin@ivrenterprise.com',
      passwordHash: adminPass,
      name: 'IVR Operations Admin',
      role: 'ADMIN',
      phone: '+91 8143177907',
      status: 'ACTIVE',
    },
  });

  // 4. Clean Batches for the 8 Engineering Domains (0 demo students, 0 demo mentors)
  const domains = [
    { name: 'FSW-COHORT-2026-A', domain: 'Full-Stack Web Development' },
    { name: 'CCD-COHORT-2026-A', domain: 'Cloud Computing & DevOps' },
    { name: 'AIML-COHORT-2026-A', domain: 'Artificial Intelligence & Machine Learning' },
    { name: 'CS-COHORT-2026-A', domain: 'Cyber Security' },
    { name: 'DSA-COHORT-2026-A', domain: 'Data Science & Analytics' },
    { name: 'MAD-COHORT-2026-A', domain: 'Mobile Application Development' },
    { name: 'UIUX-COHORT-2026-A', domain: 'UI/UX Design & Product Development' },
    { name: 'IOT-COHORT-2026-A', domain: 'Embedded Systems & IoT' },
  ];

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 60);

  for (const item of domains) {
    await prisma.batch.create({
      data: {
        name: item.name,
        domain: item.domain,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });
  }

  // 5. Initial System Initialization Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      module: 'SYSTEM',
      details: 'IVR TECH SOLUTIONS PRIVATE LIMITED platform initialized with clean student and mentor registries.',
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Clean database seed completed successfully!');
  console.log('   - 0 Demo Students');
  console.log('   - 0 Demo Mentors');
  console.log('   - 0 Demo Submissions / Certificates / Fake Transactions');
  console.log('   - Genuine Admin: admin@ivrtechsolution.in (Admin@IVR2026!)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
