import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { feeType } = await req.json(); // REGISTRATION or PROGRAM_FEE

    const settings = await prisma.systemSettings.findFirst();
    const amount = feeType === 'REGISTRATION' ? (settings?.registrationFeeINR || 499) : (settings?.programFeeINR || 4999);

    const orderId = `IVR-ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const razorpayOrderId = `order_${Date.now()}_rzp`;

    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        orderId,
        studentId: student.id,
        amount,
        currency: 'INR',
        feeType: feeType || 'PROGRAM_FEE',
        status: 'PENDING',
        razorpayOrderId,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'STUDENT',
      action: 'PAYMENT_ORDER_CREATE',
      module: 'PAYMENTS',
      details: `Created payment order ${orderId} for ₹${amount} (${feeType})`,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: paymentOrder.id,
        orderId: paymentOrder.orderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        feeType: paymentOrder.feeType,
        razorpayOrderId: paymentOrder.razorpayOrderId,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ivr2026enterprise',
      },
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
