import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { dispatchNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fullName, email, phone, college, department, graduationYear, domain, statement, resumeUrl } = data;

    if (!fullName || !email || !phone || !college || !department || !graduationYear || !domain) {
      return NextResponse.json({ error: 'Please provide all required fields' }, { status: 400 });
    }

    // Check if application with this email already exists
    const existing = await prisma.application.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `An active application already exists with email ${email}. Reference number: ${existing.refNumber}`,
          refNumber: existing.refNumber,
        },
        { status: 409 }
      );
    }

    // Generate reference number
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const refNumber = `IVR-APP-2026-${randomDigits}`;

    const application = await prisma.application.create({
      data: {
        refNumber,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        college: college.trim(),
        department: department.trim(),
        graduationYear: parseInt(graduationYear, 10),
        domain,
        statement: statement || null,
        resumeUrl: resumeUrl || null,
        status: 'PENDING',
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await dispatchNotification({
        userId: admin.id,
        userEmail: admin.email,
        userName: admin.name,
        title: 'New Internship Application Received',
        message: `${fullName} has applied for ${domain} (${refNumber}).`,
        type: 'INFO',
        actionUrl: '/admin/students',
      });
    }

    // Send confirmation email to applicant
    await dispatchNotification({
      userId: 'public-applicant',
      userEmail: email,
      userName: fullName,
      title: 'Application Received - IVR Enterprise Internship',
      message: `Thank you for applying to the IVR Enterprise Internship Program for <strong>${domain}</strong>.<br><br>Your Application Reference Number is: <strong>${refNumber}</strong>.<br><br>Our Academic Admissions Committee will review your application within 2-3 business days. You can check your application status anytime at our portal.`,
      type: 'SUCCESS',
      actionUrl: `http://localhost:3000/application-status?ref=${refNumber}`,
      channels: ['EMAIL'],
    });

    await logAuditEvent({
      userEmail: email,
      userRole: 'PUBLIC_APPLICANT',
      action: 'APPLICATION_SUBMITTED',
      module: 'APPLICATIONS',
      details: `New application submitted: ${refNumber} (${fullName}, ${domain})`,
    });

    return NextResponse.json({
      success: true,
      refNumber,
      message: 'Your application has been received successfully.',
    });
  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json({ error: 'Internal server error processing application' }, { status: 500 });
  }
}
