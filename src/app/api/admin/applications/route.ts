import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const domain = searchParams.get('domain') || '';
    const search = searchParams.get('search') || '';

    const whereClause: Record<string, unknown> = {};
    if (status) whereClause.status = status;
    if (domain) whereClause.domain = domain;
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { refNumber: { contains: search } },
        { college: { contains: search } },
      ];
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { applicationId, action, notes, batchId, mentorId } = await req.json();

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'Application ID and action are required' }, { status: 400 });
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Check if user account with this email already exists
      let user = await prisma.user.findUnique({ where: { email: app.email } });
      const defaultPassword = 'Student@IVR2026!';

      if (!user) {
        const passwordHash = await hashPassword(defaultPassword);
        user = await prisma.user.create({
          data: {
            name: app.fullName,
            email: app.email,
            phone: app.phone,
            passwordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
          },
        });

        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            college: app.college,
            department: app.department,
            graduationYear: app.graduationYear,
            domain: app.domain,
            batchId: batchId || null,
            mentorId: mentorId || null,
            resumeUrl: app.resumeUrl,
          },
        });
      }

      const updated = await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          notes: notes || 'Application approved by admissions board.',
          reviewedBy: adminUser.name,
          reviewedAt: new Date(),
        },
      });

      // Send congratulations email with portal credentials
      await dispatchNotification({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        title: 'Application Approved - IVR Enterprise Internship',
        message: `Congratulations! Your application (<strong>${app.refNumber}</strong>) for <strong>${app.domain}</strong> has been approved by the IVR Academic Admissions Board.<br><br><strong>Your Student Portal Credentials:</strong><br>Portal URL: <a href="http://localhost:3000/login">http://localhost:3000/login</a><br>Email: <strong>${user.email}</strong><br>Password: <strong>${defaultPassword}</strong><br><br>Please log in to review your cohort schedule and verify your internship enrollment.`,
        type: 'SUCCESS',
        actionUrl: 'http://localhost:3000/login',
        channels: ['EMAIL', 'WHATSAPP'],
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'APPLICATION_APPROVE',
        module: 'APPLICATIONS',
        details: `Approved application ${app.refNumber} for ${app.fullName} (${app.email})`,
      });

      return NextResponse.json({
        success: true,
        message: `Application ${app.refNumber} approved. Student account created.`,
        application: updated,
      });
    }

    if (action === 'REJECT') {
      const updated = await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          notes: notes || 'Does not meet cohort prerequisites at this time.',
          reviewedBy: adminUser.name,
          reviewedAt: new Date(),
        },
      });

      await dispatchNotification({
        userId: 'public-applicant',
        userEmail: app.email,
        userName: app.fullName,
        title: 'IVR Enterprise Internship Application Status Update',
        message: `Thank you for your interest in IVR Enterprise. Following review by our Admissions Committee for ${app.domain}, we regret to inform you that we cannot offer admission for the current cohort.<br><br>Notes: ${notes || 'Competitive cohort capacity reached.'}`,
        type: 'ALERT',
        channels: ['EMAIL'],
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'APPLICATION_REJECT',
        module: 'APPLICATIONS',
        details: `Rejected application ${app.refNumber} for ${app.fullName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Application ${app.refNumber} marked as rejected.`,
        application: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Application review error:', error);
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 });
  }
}
