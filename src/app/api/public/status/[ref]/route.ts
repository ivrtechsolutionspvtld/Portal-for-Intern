import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, props: { params: Promise<{ ref: string }> }) {
  try {
    const params = await props.params;
    const ref = decodeURIComponent(params.ref).trim().toUpperCase();

    const application = await prisma.application.findUnique({
      where: { refNumber: ref },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found with the provided reference number' }, { status: 404 });
    }

    return NextResponse.json({
      application: {
        refNumber: application.refNumber,
        fullName: application.fullName,
        domain: application.domain,
        college: application.college,
        status: application.status,
        notes: application.notes,
        createdAt: application.createdAt,
        reviewedAt: application.reviewedAt,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
