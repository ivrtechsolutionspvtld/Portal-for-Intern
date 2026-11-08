import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { sendEmailNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role = 'STUDENT', email, password, name, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Full name, email address, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate user email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in or use a different email.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const year = new Date().getFullYear();

    if (role === 'MENTOR') {
      const {
        employeeId,
        designation = 'Technical Mentor',
        department = 'Software Engineering',
        expertise = 'Full-Stack Engineering',
        experience = '2 Years',
        assignedProgram,
        bio,
        avatar,
      } = body;

      // Generate unique Mentor ID
      let mentorId = `IVR-MEN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      let isUnique = false;
      while (!isUnique) {
        const found = await prisma.mentorProfile.findUnique({ where: { mentorId } });
        if (!found) isUnique = true;
        else mentorId = `IVR-MEN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          role: 'MENTOR',
          phone: phone?.trim(),
          avatar: avatar || null,
          status: 'PENDING_APPROVAL',
          isDemo: false,
          mentorProfile: {
            create: {
              mentorId,
              employeeId: employeeId?.trim() || `EMP-${mentorId}`,
              designation: designation.trim(),
              department: department.trim(),
              expertise: expertise.trim(),
              experience: experience?.trim() || '1 Year',
              assignedProgram: assignedProgram || 'Full-Stack Web Development',
              bio: bio?.trim() || null,
              maxStudents: 30,
            },
          },
        },
        include: { mentorProfile: true },
      });

      // Admin alert notification
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Mentor Registration Pending Approval',
            message: `${name} has registered as a Mentor (${designation}, ${department}). Please review in Account Approvals.`,
            type: 'INFO',
            link: '/admin/approvals',
          },
        });
      }

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        userRole: 'MENTOR',
        action: 'MENTOR_REGISTRATION_SUBMITTED',
        module: 'REGISTRATION',
        details: `Mentor application submitted by ${user.name} (${mentorId}). Status set to PENDING_APPROVAL.`,
      });

      // Trigger transactional email
      await sendEmailNotification({
        to: user.email,
        subject: 'IVR Tech Solutions - Mentor Registration Received (Pending Approval)',
        template: 'APPLICATION_SUBMITTED',
        variables: {
          name: user.name,
          refNumber: mentorId,
          domain: assignedProgram || 'Technical Mentorship',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Mentor registration submitted successfully. Your account is pending administrator approval.',
        id: mentorId,
        status: 'PENDING_APPROVAL',
      });
    }

    // Default: STUDENT Registration
    const {
      college,
      department,
      degree = 'B.Tech',
      academicYear = 'Final Year',
      graduationYear = year,
      regNumber,
      dob,
      address,
      resumeUrl,
      avatar,
      bio,
    } = body;

    // Check mandatory fields according to system settings
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'ivr-global-settings' },
    });
    const mandatoryList = (settings?.mandatoryStudentFields || 'name,email,phone,college,department,graduationYear').split(',');

    if (mandatoryList.includes('college') && !college) {
      return NextResponse.json({ error: 'College / University is required.' }, { status: 400 });
    }
    if (mandatoryList.includes('department') && !department) {
      return NextResponse.json({ error: 'Department is required.' }, { status: 400 });
    }

    // Generate unique Student ID
    let studentId = `IVR-STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    let isUnique = false;
    while (!isUnique) {
      const found = await prisma.studentProfile.findUnique({ where: { studentId } });
      if (!found) isUnique = true;
      else studentId = `IVR-STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Students cannot self-allocate courses or mentors; strictly Pending Allocation
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role: 'STUDENT',
        phone: phone?.trim(),
        avatar: avatar || null,
        status: 'PENDING_APPROVAL',
        isDemo: false,
        studentProfile: {
          create: {
            studentId,
            college: college?.trim() || 'Collegiate Institute',
            department: department?.trim() || 'Computer Science',
            degree: degree?.trim() || 'B.Tech',
            academicYear: academicYear?.trim() || 'Final Year',
            graduationYear: parseInt(graduationYear, 10) || year,
            regNumber: regNumber?.trim() || null,
            dob: dob ? new Date(dob) : null,
            address: address?.trim() || null,
            domain: 'Pending Course Allocation',
            courseId: null,
            mentorId: null,
            batchId: null,
            resumeUrl: resumeUrl?.trim() || null,
            bio: bio?.trim() || null,
          },
        },
      },
      include: { studentProfile: true },
    });

    // Admin alert notification
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Student Registration Pending Approval',
          message: `${name} has applied for ${domain} (${college || 'Student'}). Please review in Account Approvals.`,
          type: 'INFO',
          link: '/admin/approvals',
        },
      });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'STUDENT',
      action: 'STUDENT_REGISTRATION_SUBMITTED',
      module: 'REGISTRATION',
      details: `Student registration submitted by ${user.name} (${studentId}, ${domain}). Status set to PENDING_APPROVAL.`,
    });

    // Trigger transactional email
    await sendEmailNotification({
      to: user.email,
      subject: 'IVR Tech Solutions - Internship Registration Received (Pending Verification)',
      template: 'APPLICATION_SUBMITTED',
      variables: {
        name: user.name,
        refNumber: studentId,
        domain: domain,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student registration submitted successfully. Your account is pending administrator approval.',
      id: studentId,
      status: 'PENDING_APPROVAL',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing registration.' },
      { status: 500 }
    );
  }
}

