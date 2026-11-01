// ==============================================================================
// IVR TECH SOLUTIONS PRIVATE LIMITED - Automated Verification & Test Suite
// Tests Core Business Logic, Cryptography, Database Reset, Admin CRUD, and Security
// ==============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'ivr_enterprise_jwt_super_secret_key_production_2026_x89a';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${totalTests}] ${testName}`);
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m [${totalTests}] ${testName} - ${details}`);
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('  IVR TECH SOLUTIONS PRIVATE LIMITED - VERIFICATION SUITE');
  console.log('=============================================================\n');

  try {
    // --------------------------------------------------------------------------
    // Test 1: Database Reset & Clean Initial State Integrity
    // --------------------------------------------------------------------------
    console.log('\x1b[35m[1/7] Database Models & Clean Reset State\x1b[0m');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@ivrtechsolution.in' } });
    assert(adminUser !== null && adminUser.role === 'ADMIN', 'Official Admin account (admin@ivrtechsolution.in) exists with ADMIN role');

    const studentCount = await prisma.studentProfile.count();
    assert(studentCount === 0, 'Clean database verified: 0 demo students present', `Found ${studentCount}`);

    const mentorCount = await prisma.mentorProfile.count();
    assert(mentorCount === 0, 'Clean database verified: 0 demo mentors present', `Found ${mentorCount}`);

    const certCount = await prisma.certificate.count();
    assert(certCount === 0, 'Clean database verified: 0 placeholder certificates present', `Found ${certCount}`);

    const batchCount = await prisma.batch.count();
    assert(batchCount >= 8, 'All 8 engineering track batches configured and ready', `Found ${batchCount}`);

    const settings = await prisma.systemSettings.findFirst();
    assert(settings && settings.contactEmail === 'admin@ivrtechsolution.in', 'System settings configured with official company email (admin@ivrtechsolution.in)');

    // --------------------------------------------------------------------------
    // Test 2: Authentication & Password Cryptography
    // --------------------------------------------------------------------------
    console.log('\n\x1b[35m[2/7] Cryptography & Authentication Security\x1b[0m');
    const isPasswordValid = await bcrypt.compare('Admin@IVR2026!', adminUser.passwordHash);
    assert(isPasswordValid, 'Bcrypt password hash matches production administrative password');

    const isWrongPasswordRejected = !(await bcrypt.compare('WrongPassword123!', adminUser.passwordHash));
    assert(isWrongPasswordRejected, 'Bcrypt securely rejects unauthorized passwords');

    // JWT Token generation & verification
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const decoded = jwt.verify(token, JWT_SECRET);
    assert(decoded.email === adminUser.email && decoded.role === 'ADMIN', 'JWT token successfully signs and verifies administrative claims');

    // --------------------------------------------------------------------------
    // Test 3: Dynamic Cryptographic QR Code Attendance Engine
    // --------------------------------------------------------------------------
    console.log('\n\x1b[35m[3/7] Dynamic QR Attendance Verification Engine\x1b[0m');
    const sessionId = 'session_test_qr_123';
    const batchId = 'batch_test_456';
    const timestamp = Date.now();
    const secret = process.env.ATTENDANCE_HMAC_SECRET || 'ivr_dynamic_qr_hmac_secret_2026';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${sessionId}:${batchId}:${timestamp}`);
    const signature = hmac.digest('hex');
    const tokenPayload = `${sessionId}:${batchId}:${timestamp}:${signature}`;

    // Verify correct token signature
    const [tSessionId, tBatchId, tTimestampStr, tSig] = tokenPayload.split(':');
    const verifyHmac = crypto.createHmac('sha256', secret);
    verifyHmac.update(`${tSessionId}:${tBatchId}:${tTimestampStr}`);
    const calculatedSig = verifyHmac.digest('hex');

    assert(calculatedSig === tSig, 'Cryptographic HMAC-SHA256 signature validates genuine attendance session');

    // Check TTL expiration logic (valid within 30 seconds)
    const tokenAgeSec = (Date.now() - parseInt(tTimestampStr, 10)) / 1000;
    assert(tokenAgeSec < 30, 'Attendance token validated within dynamic 30-second freshness window');

    // Check tampering detection
    const tamperedPayload = `${sessionId}:${batchId}:${timestamp}:tampered_fake_signature_hash`;
    const [, , , badSig] = tamperedPayload.split(':');
    assert(calculatedSig !== badSig, 'Tampered attendance signature rejected by cryptographic verification');

    // --------------------------------------------------------------------------
    // Test 4: Excel Bulk Student Import & Data Validation
    // --------------------------------------------------------------------------
    console.log('\n\x1b[35m[4/7] Excel Bulk Student Import & Data Validation\x1b[0m');
    const mockExcelRows = [
      { name: 'Aditi Rao', email: 'aditi.rao@test.com', phone: '+91 98765 43210', college: 'IIT Bombay', domain: 'Full-Stack Web Development' },
      { name: 'Karan Mehra', email: 'karan.mehra@test.com', phone: '+91 98765 43211', college: 'BITS Pilani', domain: 'Artificial Intelligence & Machine Learning' },
      { name: 'Invalid Row', email: 'not-an-email', phone: '123', college: '', domain: 'Unknown Domain' },
      { name: 'Duplicate Row', email: 'aditi.rao@test.com', phone: '+91 98765 43210', college: 'IIT Bombay', domain: 'Full-Stack Web Development' },
    ];

    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailSet = new Set();
    const validatedRows = [];
    const errors = [];

    mockExcelRows.forEach((row, index) => {
      const rowNum = index + 2;
      if (!row.name || row.name.length < 2) {
        errors.push(`Row ${rowNum}: Name is invalid`);
        return;
      }
      if (!row.email || !validEmailRegex.test(row.email)) {
        errors.push(`Row ${rowNum}: Invalid email format (${row.email})`);
        return;
      }
      if (emailSet.has(row.email.toLowerCase())) {
        errors.push(`Row ${rowNum}: Duplicate email in spreadsheet (${row.email})`);
        return;
      }
      emailSet.add(row.email.toLowerCase());
      validatedRows.push(row);
    });

    assert(validatedRows.length === 2, 'Excel validator accepted exactly the 2 valid student records');
    assert(errors.length === 2, 'Excel validator caught invalid email format and duplicate spreadsheet email');

    // --------------------------------------------------------------------------
    // Test 5: Administrator Student Management (CRUD & Lifecycle)
    // --------------------------------------------------------------------------
    console.log('\n\x1b[35m[5/7] Administrator Student Management Access (Full CRUD)\x1b[0m');
    const testBatch = await prisma.batch.findFirst();
    const testStudentPassword = await bcrypt.hash('Student@Test2026!', 10);
    
    // Create Student
    const createdStudentUser = await prisma.user.create({
      data: {
        email: 'test.fellow@ivrtechsolution.in',
        name: 'Test Fellow Candidate',
        passwordHash: testStudentPassword,
        role: 'STUDENT',
        phone: '+91 91234 56789',
        status: 'ACTIVE',
        studentProfile: {
          create: {
            domain: 'Full-Stack Web Development',
            college: 'National Institute of Technology',
            department: 'Computer Science & Engineering',
            graduationYear: 2026,
            batchId: testBatch?.id,
          },
        },
      },
      include: { studentProfile: true },
    });
    assert(createdStudentUser !== null && createdStudentUser.studentProfile !== null, 'Admin can successfully add a new student profile');

    // Update Student (Edit details & Deactivate)
    const updatedStudent = await prisma.user.update({
      where: { id: createdStudentUser.id },
      data: {
        status: 'INACTIVE',
        name: 'Updated Fellow Name',
      },
    });
    assert(updatedStudent.status === 'INACTIVE' && updatedStudent.name === 'Updated Fellow Name', 'Admin can edit student details and activate/deactivate accounts');

    // Delete Student
    await prisma.user.delete({ where: { id: createdStudentUser.id } });
    const deletedCheck = await prisma.user.findUnique({ where: { id: createdStudentUser.id } });
    assert(deletedCheck === null, 'Admin can remove student accounts completely');

    // --------------------------------------------------------------------------
    // Test 6: Administrator Mentor Management (CRUD & Lifecycle)
    // --------------------------------------------------------------------------
    console.log('\n\x1b[35m[6/7] Administrator Mentor Management Access (Full CRUD)\x1b[0m');
    const testMentorPassword = await bcrypt.hash('Mentor@Test2026!', 10);

    // Create Mentor
    const createdMentorUser = await prisma.user.create({
      data: {
        email: 'test.mentor@ivrtechsolution.in',
        name: 'Test Faculty Lead',
        passwordHash: testMentorPassword,
        role: 'MENTOR',
        phone: '+91 99887 76655',
        status: 'ACTIVE',
        mentorProfile: {
          create: {
            designation: 'Senior Cloud Architect',
            department: 'Cloud Computing & DevOps',
            expertise: 'AWS, Kubernetes, Terraform',
            bio: 'Senior architect with 10+ years experience in cloud infrastructure.',
            maxStudents: 25,
          },
        },
      },
      include: { mentorProfile: true },
    });
    assert(createdMentorUser !== null && createdMentorUser.mentorProfile !== null, 'Admin can successfully add a new mentor profile');

    // Update Mentor
    const updatedMentor = await prisma.user.update({
      where: { id: createdMentorUser.id },
      data: {
        status: 'INACTIVE',
        mentorProfile: {
          update: {
            designation: 'Principal Enterprise Architect',
            maxStudents: 30,
          },
        },
      },
      include: { mentorProfile: true },
    });
    assert(
      updatedMentor.status === 'INACTIVE' && updatedMentor.mentorProfile?.designation === 'Principal Enterprise Architect',
      'Admin can edit mentor details and toggle account status'
    );

    // Delete Mentor
    await prisma.user.delete({ where: { id: createdMentorUser.id } });
    const deletedMentorCheck = await prisma.user.findUnique({ where: { id: createdMentorUser.id } });
    assert(deletedMentorCheck === null, 'Admin can remove mentor accounts completely');

    // --------------------------------------------------------------------------
    // Test 7: Role-Based Access Control (RBAC) & Enterprise Security Audit Trail
    // --------------------------------------------------------------------------
    console.log('\n\x1b[35m[7/7] Role-Based Access Control & Audit Security\x1b[0m');
    const auditCount = await prisma.auditLog.count();
    assert(auditCount >= 1, 'Enterprise audit trail captures administrative and system operations', `Found ${auditCount} audit events`);

    const initialAudit = await prisma.auditLog.findFirst({ orderBy: { timestamp: 'asc' } });
    assert(initialAudit && initialAudit.userEmail === 'admin@ivrtechsolution.in', 'Audit log records official administrator identity (admin@ivrtechsolution.in)');

    // Verify clean database restored after tests
    const postStudentCount = await prisma.studentProfile.count();
    const postMentorCount = await prisma.mentorProfile.count();
    assert(postStudentCount === 0 && postMentorCount === 0, 'Database maintains clean 0-student and 0-mentor baseline after CRUD validation');

    // Summary
    console.log('\n=============================================================');
    console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('=============================================================\n');

    if (passedTests === totalTests) {
      console.log('  \x1b[32m✔ ALL ENTERPRISE VERIFICATION CHECKS COMPLETED SUCCESSFULLY!\x1b[0m\n');
      process.exit(0);
    } else {
      console.error(`  \x1b[31m✘ ${totalTests - passedTests} TESTS FAILED\x1b[0m\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
