import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';
import { generateAttendanceToken, generateQRCodeDataUrl } from '@/lib/qr';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user, mentorProfile } = auth.data;
    const { batchId, durationMinutes = 15 } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Verify batch exists and belongs to this mentor
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch.mentorId && batch.mentorId !== mentorProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to create an attendance session for this batch.' },
        { status: 403 }
      );
    }

    // Deactivate previous active sessions for this batch
    await prisma.attendanceSession.updateMany({
      where: { batchId, isActive: true },
      data: { isActive: false },
    });

    const sessionId = `SESSION-${Date.now()}`;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const token = generateAttendanceToken(sessionId, batchId, mentorProfile.id);

    // Save session in database
    const session = await prisma.attendanceSession.create({
      data: {
        id: sessionId,
        batchId,
        mentorId: mentorProfile.id,
        sessionDate: new Date(),
        token,
        expiresAt,
        isActive: true,
      },
    });

    // Generate QR Code data URL containing the secure token
    const qrDataUrl = await generateQRCodeDataUrl(token);

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'ATTENDANCE_SESSION_CREATED',
      module: 'ATTENDANCE',
      details: `Created attendance session for batch ${batch.name} (${batchId}), expires in ${durationMinutes} mins`,
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        batchName: batch.name,
        expiresAt: session.expiresAt,
        token: session.token,
        qrCode: qrDataUrl,
      },
    });
  } catch (error: any) {
    console.error('Create attendance session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create attendance session' },
      { status: 500 }
    );
  }
}
