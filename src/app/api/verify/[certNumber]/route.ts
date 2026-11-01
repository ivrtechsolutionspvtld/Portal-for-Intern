import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, props: { params: Promise<{ certNumber: string }> }) {
  try {
    const params = await props.params;
    const certNumber = decodeURIComponent(params.certNumber).trim().toUpperCase();

    const cert = await prisma.certificate.findUnique({
      where: { certificateNumber: certNumber },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            batch: { select: { name: true, startDate: true, endDate: true } },
          },
        },
      },
    });

    if (!cert) {
      return NextResponse.json({
        valid: false,
        status: 'NOT_FOUND',
        message: 'No certificate found with the specified verification identifier.',
      }, { status: 404 });
    }

    if (cert.status === 'REVOKED') {
      return NextResponse.json({
        valid: false,
        status: 'REVOKED',
        message: 'This certificate was officially REVOKED by IVR Academic Board.',
        certificateNumber: cert.certificateNumber,
        studentName: cert.student.user.name,
        domain: cert.domain,
        issueDate: cert.issueDate,
      });
    }

    return NextResponse.json({
      valid: true,
      status: 'VALID',
      certificate: {
        certificateNumber: cert.certificateNumber,
        studentName: cert.student.user.name,
        domain: cert.domain,
        issueDate: cert.issueDate,
        completionDate: cert.completionDate,
        issuedBy: cert.issuedBy,
        templateName: cert.templateName,
        batchName: cert.student.batch?.name || 'Enterprise Cohort',
        qrCodeData: cert.qrCodeData,
        verificationUrl: cert.verificationUrl,
      },
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json({ error: 'Internal server error verifying certificate' }, { status: 500 });
  }
}
