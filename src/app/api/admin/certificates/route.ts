import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { generateQRCodeDataUrl } from '@/lib/qr';
import { dispatchNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const certificates = await prisma.certificate.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            batch: { select: { name: true } },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    // Also get eligible candidates who don't have a certificate yet
    const studentsWithoutCert = await prisma.studentProfile.findMany({
      where: { certificate: null },
      include: {
        user: { select: { name: true, email: true } },
        batch: { select: { name: true } },
        attendanceRecords: true,
        submissions: true,
      },
    });

    const eligibleCandidates = studentsWithoutCert.map((s) => {
      const totalAtt = s.attendanceRecords.length;
      const presentAtt = s.attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;
      const approvedProjects = s.submissions.filter((sub) => sub.status === 'APPROVED').length;
      const isEligible = attRate >= 80 && approvedProjects >= 1;

      return {
        studentProfileId: s.id,
        name: s.user.name,
        email: s.user.email,
        domain: s.domain,
        batchName: s.batch?.name || 'Unassigned',
        attendanceRate: attRate,
        approvedProjects,
        isEligible,
      };
    });

    return NextResponse.json({
      certificates,
      eligibleCandidates,
    });
  } catch (error) {
    console.error('Certificates fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { action, studentProfileId, certificateNumber, notes } = await req.json();

    if (action === 'ISSUE') {
      if (!studentProfileId) {
        return NextResponse.json({ error: 'Student Profile ID is required' }, { status: 400 });
      }

      const student = await prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        include: { user: true, certificate: true },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      if (student.certificate) {
        return NextResponse.json({ error: 'Certificate already issued for this student', certificate: student.certificate }, { status: 409 });
      }

      // Generate unique Certificate Number
      const randHex = Math.floor(10000 + Math.random() * 90000);
      const generatedCertNumber = `IVR-CERT-2026-${randHex}`;
      const verifyUrl = `http://localhost:3000/verify/${generatedCertNumber}`;
      const qrCodeData = await generateQRCodeDataUrl(verifyUrl);

      const certificate = await prisma.certificate.create({
        data: {
          certificateNumber: generatedCertNumber,
          studentId: student.id,
          domain: student.domain,
          issueDate: new Date(),
          completionDate: new Date(),
          verificationUrl: verifyUrl,
          qrCodeData,
          status: 'VALID',
          issuedBy: `${adminUser.name} (Academic Board & Enterprise Operations)`,
        },
      });

      // Notify student
      await dispatchNotification({
        userId: student.userId,
        userEmail: student.user.email,
        userName: student.user.name,
        title: 'Official Internship Certificate Issued',
        message: `Congratulations! Your official IVR Enterprise Internship Certificate (<strong>${generatedCertNumber}</strong>) has been verified and issued.<br><br>You can download your high-resolution PDF certificate with digital signature and QR verification from your student portal.`,
        type: 'SUCCESS',
        actionUrl: 'http://localhost:3000/student/certificate',
        channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'CERTIFICATE_ISSUE',
        module: 'CERTIFICATES',
        details: `Issued Certificate ${generatedCertNumber} to ${student.user.name} (${student.user.email})`,
      });

      return NextResponse.json({ success: true, certificate });
    }

    if (action === 'REVOKE') {
      if (!certificateNumber) {
        return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 });
      }

      const updated = await prisma.certificate.update({
        where: { certificateNumber },
        data: { status: 'REVOKED' },
        include: { student: { include: { user: true } } },
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'CERTIFICATE_REVOKE',
        module: 'CERTIFICATES',
        details: `Revoked Certificate ${certificateNumber} of student ${updated.student.user.name}. Reason: ${notes || 'Administrative action'}`,
      });

      return NextResponse.json({ success: true, message: `Certificate ${certificateNumber} revoked`, certificate: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Certificate operation error:', error);
    return NextResponse.json({ error: 'Failed to process certificate action' }, { status: 500 });
  }
}
