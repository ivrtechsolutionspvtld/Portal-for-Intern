import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const feeType = searchParams.get('feeType') || '';

    const whereClause: Record<string, unknown> = {};
    if (status) whereClause.status = status;
    if (feeType) whereClause.feeType = feeType;

    const orders = await prisma.paymentOrder.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            batch: { select: { name: true } },
          },
        },
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCollected = orders
      .filter((o) => o.status === 'SUCCESS')
      .reduce((sum, o) => sum + o.amount, 0);

    const pendingAmount = orders
      .filter((o) => o.status === 'PENDING')
      .reduce((sum, o) => sum + o.amount, 0);

    const formatted = orders.map((o) => ({
      id: o.id,
      orderId: o.orderId,
      studentName: o.student.user.name,
      studentEmail: o.student.user.email,
      studentPhone: o.student.user.phone,
      batchName: o.student.batch?.name || 'Unassigned',
      amount: o.amount,
      currency: o.currency,
      feeType: o.feeType,
      status: o.status,
      razorpayOrderId: o.razorpayOrderId,
      razorpayPaymentId: o.razorpayPaymentId,
      receiptNumber: o.receiptNumber,
      createdAt: o.createdAt,
      transactions: o.transactions,
    }));

    // Fetch system settings for fee configuration
    const settings = await prisma.systemSettings.findFirst();

    return NextResponse.json({
      orders: formatted,
      metrics: {
        totalCollected,
        pendingAmount,
        totalOrders: orders.length,
        successfulCount: orders.filter((o) => o.status === 'SUCCESS').length,
        pendingCount: orders.filter((o) => o.status === 'PENDING').length,
      },
      settings,
    });
  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { action, orderId, registrationFee, programFee } = await req.json();

    if (action === 'UPDATE_FEE_CONFIG') {
      const updatedSettings = await prisma.systemSettings.update({
        where: { id: 'ivr-global-settings' },
        data: {
          registrationFeeINR: registrationFee ? parseFloat(registrationFee) : undefined,
          programFeeINR: programFee ? parseFloat(programFee) : undefined,
        },
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'FEE_CONFIG_UPDATE',
        module: 'PAYMENT_ADMIN',
        details: `Updated fee configuration: Reg Fee ₹${registrationFee}, Prog Fee ₹${programFee}`,
      });

      return NextResponse.json({ success: true, settings: updatedSettings });
    }

    if (action === 'MANUAL_VERIFY') {
      if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }

      const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const order = await prisma.paymentOrder.update({
        where: { orderId },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId: `manual_auth_${Date.now()}`,
          receiptNumber,
        },
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'PAYMENT_MANUAL_VERIFY',
        module: 'PAYMENT_ADMIN',
        details: `Manually marked order ${orderId} as verified with receipt ${receiptNumber}`,
      });

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Payment admin error:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
