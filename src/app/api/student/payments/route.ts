import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        paymentOrders: {
          include: { transactions: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const settings = await prisma.systemSettings.findFirst();

    const isProgramFeePaid = student.paymentOrders.some(
      (o) => o.feeType === 'PROGRAM_FEE' && o.status === 'SUCCESS'
    );
    const isRegistrationFeePaid = student.paymentOrders.some(
      (o) => o.feeType === 'REGISTRATION' && o.status === 'SUCCESS'
    );

    return NextResponse.json({
      orders: student.paymentOrders,
      feeConfig: {
        registrationFee: settings?.registrationFeeINR || 499,
        programFee: settings?.programFeeINR || 4999,
        currency: 'INR',
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ivr2026enterprise',
      },
      statusSummary: {
        isRegistrationFeePaid,
        isProgramFeePaid,
        allSettled: isRegistrationFeePaid && isProgramFeePaid,
      },
    });
  } catch (error) {
    console.error('Student payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
