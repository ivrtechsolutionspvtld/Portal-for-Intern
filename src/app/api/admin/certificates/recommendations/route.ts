import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getAuthFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    let admin: any = await getAuthFromRequest(req);
    if (!admin) admin = await getSessionUser();

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const recommendations = await prisma.certificateRecommendation.findMany({
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            course: { select: { title: true } },
            batch: { select: { name: true } },
          },
        },
        mentor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, recommendations });
  } catch (error: any) {
    console.error('Fetch recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificate recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let admin: any = await getAuthFromRequest(req);
    if (!admin) admin = await getSessionUser();

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { recommendationId, action = 'APPROVE', adminRemarks } = body;

    if (!recommendationId) {
      return NextResponse.json({ error: 'Recommendation ID is required.' }, { status: 400 });
    }

    const recommendation = await prisma.certificateRecommendation.findUnique({
      where: { id: recommendationId },
      include: {
        student: { include: { user: true } },
        mentor: { include: { user: true } },
      },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation record not found.' }, { status: 404 });
    }

    const isApprove = action === 'APPROVE';
    const updatedStatus = isApprove ? 'APPROVED' : 'REJECTED';

    const updatedRec = await prisma.certificateRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: updatedStatus,
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    });

    // If approved, create official Certificate record if student does not have one
    let certificate = null;
    if (isApprove) {
      const certNum = `IVR-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      certificate = await prisma.certificate.upsert({
        where: { studentId: recommendation.studentId },
        update: {
          status: 'VALID',
          completionDate: new Date(),
        },
        create: {
          certificateNumber: certNum,
          studentId: recommendation.studentId,
          domain: recommendation.student.domain,
          issueDate: new Date(),
          completionDate: new Date(),
          verificationUrl: `https://portal-for-intern.vercel.app/verify/${certNum}`,
          qrCodeData: `IVR-VERIFY:${certNum}:${recommendation.student.user.name}`,
          status: 'VALID',
        },
      });

      // Notify student
      await dispatchNotification({
        userId: recommendation.student.userId,
        userEmail: recommendation.student.user.email,
        userName: recommendation.student.user.name,
        title: 'Internship Certificate Approved & Issued!',
        message: `Congratulations! Your faculty mentor ${recommendation.mentor.user.name} recommended you and Administration has approved your internship credential (${certNum}). You can view and download your verifiable credential in the portal.`,
        type: 'SUCCESS',
        actionUrl: '/student/certificate',
        channels: ['IN_APP', 'EMAIL'],
      });
    }

    await logAuditEvent({
      userId: admin.id,
      userEmail: admin.email,
      userRole: 'ADMIN',
      action: isApprove ? 'CERTIFICATE_RECOMMENDATION_APPROVED' : 'CERTIFICATE_RECOMMENDATION_REJECTED',
      module: 'CERTIFICATES',
      details: `${isApprove ? 'Approved' : 'Rejected'} certificate recommendation for ${recommendation.student.user.name} submitted by mentor ${recommendation.mentor.user.name}. Remarks: ${adminRemarks || 'Administrative review'}`,
    });

    return NextResponse.json({
      success: true,
      message: `Recommendation ${isApprove ? 'approved and credential issued' : 'rejected'}.`,
      recommendation: updatedRec,
      certificate,
    });
  } catch (error: any) {
    console.error('Process recommendation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process recommendation' },
      { status: 500 }
    );
  }
}

