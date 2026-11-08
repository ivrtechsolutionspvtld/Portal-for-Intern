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
      adminId: 'IVR-ADM-001',
      phone: '+91 8143177907',
      status: 'ACTIVE',
      lastLogin: new Date(),
    },
  });

  // Also maintain alias admin to prevent breaking any legacy auth
  await prisma.user.create({
    data: {
      email: 'admin@ivrenterprise.com',
      passwordHash: adminPass,
      name: 'IVR Operations Admin',
      role: 'ADMIN',
      adminId: 'IVR-ADM-002',
      phone: '+91 8143177907',
      status: 'ACTIVE',
      lastLogin: new Date(),
    },
  });

  // 4. Clean Courses and Batches for the 8 Engineering Domains
  const coursesData = [
    {
      code: 'IVR-CRS-FSW-101',
      title: 'Full-Stack Web Development',
      domain: 'Full-Stack Web Development',
      description: 'Master modern full-stack web applications using Next.js, React, Node.js, TypeScript, and relational databases.',
      department: 'Software Engineering',
      durationWeeks: 8,
      level: 'Advanced',
      syllabus: 'Module 1: Modern TypeScript & Next.js App Router\nModule 2: REST & Server Actions\nModule 3: PostgreSQL & Prisma ORM\nModule 4: Authentication, RBAC & Security\nModule 5: Capstone Enterprise Platform',
    },
    {
      code: 'IVR-CRS-CCD-102',
      title: 'Cloud Computing & DevOps',
      domain: 'Cloud Computing & DevOps',
      description: 'Enterprise cloud architectures on AWS, containerization with Docker, Kubernetes orchestration, and CI/CD automation.',
      department: 'Cloud Systems',
      durationWeeks: 8,
      level: 'Advanced',
      syllabus: 'Module 1: AWS Core Infrastructure\nModule 2: Containerization with Docker\nModule 3: Kubernetes Orchestration\nModule 4: CI/CD Pipelines & Terraform',
    },
    {
      code: 'IVR-CRS-AIML-103',
      title: 'Artificial Intelligence & Machine Learning',
      domain: 'Artificial Intelligence & Machine Learning',
      description: 'Applied machine learning pipelines, deep learning models, natural language processing, and LLM orchestration.',
      department: 'Data Science & AI',
      durationWeeks: 8,
      level: 'Advanced',
      syllabus: 'Module 1: Python for Data Science\nModule 2: Supervised & Unsupervised Learning\nModule 3: Deep Learning with PyTorch\nModule 4: LLMs & Generative AI',
    },
    {
      code: 'IVR-CRS-CS-104',
      title: 'Cyber Security & Network Defense',
      domain: 'Cyber Security',
      description: 'Vulnerability assessment, ethical hacking methodologies, SOC operations, defensive security, and compliance.',
      department: 'Information Security',
      durationWeeks: 8,
      level: 'Intermediate',
      syllabus: 'Module 1: Network Security & Protocols\nModule 2: Threat Modeling & Ethical Hacking\nModule 3: Web Application Security (OWASP Top 10)\nModule 4: Incident Response & Forensics',
    },
    {
      code: 'IVR-CRS-DSA-105',
      title: 'Data Science & Business Analytics',
      domain: 'Data Science & Analytics',
      description: 'Data engineering, statistical hypothesis testing, interactive dashboards, predictive modeling, and SQL analytics.',
      department: 'Analytics',
      durationWeeks: 8,
      level: 'Intermediate',
      syllabus: 'Module 1: Advanced SQL & Warehousing\nModule 2: Exploratory Data Analysis\nModule 3: Statistical Modeling\nModule 4: BI Dashboards & Storytelling',
    },
    {
      code: 'IVR-CRS-MAD-106',
      title: 'Mobile Application Development',
      domain: 'Mobile Application Development',
      description: 'Cross-platform mobile application development with React Native, state management, native device APIs, and offline sync.',
      department: 'Mobile Engineering',
      durationWeeks: 8,
      level: 'Intermediate',
      syllabus: 'Module 1: React Native Core & Navigation\nModule 2: State Management & Offline Caching\nModule 3: Native Device Integrations\nModule 4: App Store Deployment',
    },
    {
      code: 'IVR-CRS-UIUX-107',
      title: 'UI/UX Design & Product Strategy',
      domain: 'UI/UX Design & Product Development',
      description: 'User-centered design systems, design thinking, high-fidelity wireframing in Figma, interactive prototyping, and usability audits.',
      department: 'Product Design',
      durationWeeks: 6,
      level: 'All Levels',
      syllabus: 'Module 1: User Research & Empathy Mapping\nModule 2: Information Architecture & Wireframing\nModule 3: Design Systems in Figma\nModule 4: Usability Testing & Iteration',
    },
    {
      code: 'IVR-CRS-IOT-108',
      title: 'Embedded Systems & IoT Engineering',
      domain: 'Embedded Systems & IoT',
      description: 'Microcontroller programming, sensor telemetry, MQTT/CoAP protocols, RTOS fundamentals, and edge-to-cloud gateways.',
      department: 'Hardware Systems',
      durationWeeks: 8,
      level: 'Advanced',
      syllabus: 'Module 1: Microcontroller Fundamentals & C/C++\nModule 2: Sensor Interfacing & SPI/I2C Protocols\nModule 3: Wireless Networking (WiFi, BLE, LoRa)\nModule 4: Cloud Telemetry & Real-Time Dashboards',
    },
  ];

  let fswCourse: any = null;
  for (const c of coursesData) {
    const course = await prisma.course.create({
      data: {
        code: c.code,
        title: c.title,
        domain: c.domain,
        description: c.description,
        department: c.department,
        durationWeeks: c.durationWeeks,
        level: c.level,
        status: 'ACTIVE',
        syllabus: c.syllabus,
      },
    });
    if (c.code === 'IVR-CRS-FSW-101') {
      fswCourse = course;
    }
  }

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

  let fswBatch: any = null;
  for (const item of domains) {
    const createdBatch = await prisma.batch.create({
      data: {
        name: item.name,
        domain: item.domain,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });
    if (item.name === 'FSW-COHORT-2026-A') {
      fswBatch = createdBatch;
    }
  }

  // 5. Create Exactly One Demo Mentor Account
  const mentorPass = await hashPassword('MentorDemo@2026!');
  const demoMentorUser = await prisma.user.create({
    data: {
      email: 'arjun.demo@ivrtechsolution.in',
      passwordHash: mentorPass,
      name: 'Arjun Sharma',
      role: 'MENTOR',
      phone: '+91 9876543210',
      status: 'ACTIVE',
      isDemo: true,
      approvalNotes: 'Official DEMO mentor account for workflow evaluation',
      approvedAt: new Date(),
      approvedBy: adminUser.email,
    },
  });

  const demoMentorProfile = await prisma.mentorProfile.create({
    data: {
      userId: demoMentorUser.id,
      mentorId: 'IVR-DEMO-MEN-001',
      employeeId: 'IVR-DEMO-EMP-001',
      designation: 'Technical Mentor',
      department: 'Software Development',
      expertise: 'Full Stack Development',
      experience: '3 Years',
      assignedProgram: 'Full Stack Development',
      bio: 'Enterprise lead mentor for Full Stack Development demonstration cohort.',
      maxStudents: 30,
    },
  });

  // Assign demo mentor to the FSW batch
  if (fswBatch) {
    await prisma.batch.update({
      where: { id: fswBatch.id },
      data: { mentorId: demoMentorProfile.id },
    });
  }

  // 6. Create Exactly One Demo Student Account
  const studentPass = await hashPassword('StudentDemo@2026!');
  const demoStudentUser = await prisma.user.create({
    data: {
      email: 'rahul.demo@ivrtechsolution.in',
      passwordHash: studentPass,
      name: 'Rahul Kumar',
      role: 'STUDENT',
      phone: '+91 9123456789',
      status: 'ACTIVE',
      isDemo: true,
      approvalNotes: 'Official DEMO student account for workflow evaluation',
      approvedAt: new Date(),
      approvedBy: adminUser.email,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId: demoStudentUser.id,
      studentId: 'IVR-DEMO-STU-001',
      college: 'Demo Engineering College',
      department: 'Computer Science and Engineering',
      degree: 'B.Tech',
      academicYear: 'Final Year',
      graduationYear: 2026,
      regNumber: 'DEMO-REG-2026-001',
      domain: 'Full-Stack Web Development',
      courseId: fswCourse?.id,
      duration: '60 Days',
      startDate,
      endDate,
      allocatedBy: adminUser.email,
      allocatedAt: new Date(),
      batchId: fswBatch?.id,
      mentorId: demoMentorProfile.id,
      bio: 'Enrolled fellow in Demo Full Stack Development track.',
    },
  });

  // 7. Initial System Initialization Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      module: 'SYSTEM',
      details: 'IVR TECH SOLUTIONS PRIVATE LIMITED platform initialized with 1 Demo Mentor and 1 Demo Student.',
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Clean database seed completed successfully!');
  console.log('   - 1 Demo Student: rahul.demo@ivrtechsolution.in (IVR-DEMO-STU-001)');
  console.log('   - 1 Demo Mentor: arjun.demo@ivrtechsolution.in (IVR-DEMO-MEN-001)');
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
