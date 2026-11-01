import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyAttendanceToken } from '@/lib/qr';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        batch: true,
        attendanceRecords: { orderBy: { date: 'desc' } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const records = student.attendanceRecords;
    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === 'PRESENT').length;
    const lateDays = records.filter((r) => r.status === 'LATE').length;
    const absentDays = records.filter((r) => r.status === 'ABSENT').length;
    const excusedDays = records.filter((r) => r.status === 'EXCUSED').length;

    const rate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 100;

    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        method: r.method,
        markedBy: r.markedBy,
        notes: r.notes,
      })),
      stats: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        excusedDays,
        attendanceRate: rate,
        isRequirementMet: rate >= 80,
      },
    });
  } catch (error) {
    console.error('Student attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance history' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: { batch: true },
    });

    if (!student || !student.batchId) {
      return NextResponse.json({ error: 'Student is not assigned to an active batch' }, { status: 400 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Attendance token is required' }, { status: 400 });
    }

    // 1. Verify cryptographic token signature & expiration
    const verification = verifyAttendanceToken(token.trim());
    if (!verification.valid || !verification.data) {
      return NextResponse.json({ error: verification.error || 'Invalid attendance QR code' }, { status: 400 });
    }

    const { batchId, sessionId } = verification.data;

    // 2. Verify student belongs to this batch
    if (student.batchId !== batchId) {
      return NextResponse.json({ error: 'This attendance QR code is for a different batch' }, { status: 403 });
    }

    // 3. Verify session exists and is active in database
    const dbSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession || !dbSession.isActive || dbSession.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This attendance session has ended or expired' }, { status: 410 });
    }

    // 4. Duplicate prevention for today
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingRecord) {
      return NextResponse.json(
        {
          error: `Attendance already recorded for today (${existingRecord.status}). Duplicate scan ignored.`,
          record: existingRecord,
        },
        { status: 409 }
      );
    }

    // 5. Create AttendanceRecord
    const newRecord = await prisma.attendanceRecord.create({
      data: {
        studentId: student.id,
        batchId: student.batchId,
        date: today,
        status: 'PRESENT',
        method: 'QR_SCAN',
        markedBy: 'Verified QR Session',
        notes: `Authenticated QR scan on session ${sessionId}`,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'STUDENT',
      action: 'QR_ATTENDANCE_SCAN',
      module: 'ATTENDANCE',
      details: `Recorded PRESENT via QR scan for batch ${student.batch?.name} on ${today.toISOString().split('T')[0]}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance successfully marked as PRESENT via verified QR code!',
      record: newRecord,
    });
  } catch (error) {
    console.error('Scan attendance error:', error);
    return NextResponse.json({ error: 'Failed to process QR code attendance' }, { status: 500 });
  }
}
