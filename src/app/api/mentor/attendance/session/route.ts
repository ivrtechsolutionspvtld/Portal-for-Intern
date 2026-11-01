import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { generateAttendanceToken, generateQRCodeDataUrl } from '@/lib/qr';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized: Mentor access required' }, { status: 403 });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const { batchId, durationMinutes = 15 } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Verify mentor owns or teaches this batch
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Deactivate previous active sessions for this batch
    await prisma.attendanceSession.updateMany({
      where: { batchId, isActive: true },
      data: { isActive: false },
    });

    const sessionId = `SESSION-${Date.now()}`;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const token = generateAttendanceToken(sessionId, batchId, mentor.id);

    // Save session in database
    const session = await prisma.attendanceSession.create({
      data: {
        id: sessionId,
        batchId,
        mentorId: mentor.id,
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
      action: 'ATTENDANCE_SESSION_CREATE',
      module: 'ATTENDANCE',
      details: `Generated dynamic attendance QR session for batch ${batch.name} valid until ${expiresAt.toISOString()}`,
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        batchName: batch.name,
        expiresAt: session.expiresAt,
        token: session.token,
        qrDataUrl,
        durationMinutes,
      },
    });
  } catch (error) {
    console.error('QR Session generation error:', error);
    return NextResponse.json({ error: 'Failed to generate dynamic attendance session' }, { status: 500 });
  }
}
