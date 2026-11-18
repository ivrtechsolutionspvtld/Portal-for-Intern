import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      college,
      department,
      graduationYear,
      domain,
      resumeUrl,
      statement,
      secretKey,
    } = body;

    // Optional webhook verification key if configured
    const expectedKey = process.env.GOOGLE_FORMS_SYNC_SECRET;
    if (expectedKey && secretKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized: Invalid sync secret' }, { status: 401 });
    }

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent duplicate submission for same email and domain
    const existing = await prisma.application.findFirst({
      where: {
        email: normalizedEmail,
        ...(domain ? { domain: domain.trim() } : {}),
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Application already recorded in system',
        refNumber: existing.refNumber,
        isDuplicate: true,
      });
    }

    const year = new Date().getFullYear();
    const refNumber = `IVR-APP-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

    const application = await prisma.application.create({
      data: {
        refNumber,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : 'N/A',
        college: college ? college.trim() : 'Not Provided',
        department: department ? department.trim() : 'Software Engineering',
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : year,
        domain: domain ? domain.trim() : 'Web Development',
        resumeUrl: resumeUrl ? resumeUrl.trim() : null,
        statement: statement ? statement.trim() : 'Submitted via Google Form',
        status: 'PENDING',
      },
    });

    // Notify admins of new incoming application
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    for (const admin of admins) {
      try {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Google Form Application Received',
            message: `${application.fullName} applied for ${application.domain} (Ref: ${application.refNumber}).`,
            type: 'INFO',
            link: '/admin/applications',
          },
        });
      } catch {
        // Non-blocking notification
      }
    }

    await logAuditEvent({
      userId: undefined,
      userEmail: normalizedEmail,
      userRole: 'APPLICANT',
      action: 'GOOGLE_FORMS_APPLICATION_SYNC',
      module: 'APPLICATIONS',
      details: `Ingested Google Form application for ${fullName} (${refNumber}) in ${application.domain}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Application synchronized successfully',
      refNumber: application.refNumber,
      application,
    });
  } catch (error: any) {
    console.error('Google Forms Application Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync application' }, { status: 500 });
  }
}

