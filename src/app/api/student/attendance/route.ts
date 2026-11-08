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

    const [student, settings] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: user.id },
        include: {
          batch: true,
          course: true,
          attendanceRecords: { orderBy: { date: 'desc' } },
        },
      }),
      prisma.systemSettings.findUnique({
        where: { id: 'ivr-global-settings' },
      }),
    ]);

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
    const minRequired = settings?.minAttendancePercent || 75.0;

    // Check today's record
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayRecord = records.find(
      (r) => new Date(r.date) >= startOfDay && new Date(r.date) <= endOfDay
    );

    return NextResponse.json({
      success: true,
      attendanceMode: settings?.attendanceMode || 'AUTOMATIC',
      todayRecord: todayRecord
        ? {
            id: todayRecord.id,
            date: todayRecord.date.toISOString().split('T')[0],
            status: todayRecord.status,
            method: todayRecord.method,
            checkInTime: todayRecord.checkInTime,
            checkOutTime: todayRecord.checkOutTime,
            durationMinutes: todayRecord.durationMinutes,
            notes: todayRecord.notes,
          }
        : null,
      records: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        method: r.method,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        durationMinutes: r.durationMinutes,
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
        minRequiredPercent: minRequired,
        isRequirementMet: rate >= minRequired,
      },
      workHours: {
        start: settings?.workHoursStart || '09:30',
        end: settings?.workHoursEnd || '18:30',
        graceTime: settings?.lateArrivalGraceTime || '10:00',
      },
    });
  } catch (error: any) {
    console.error('Student attendance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance history' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const [student, settings] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: user.id },
        include: { batch: true, course: true },
      }),
      prisma.systemSettings.findUnique({
        where: { id: 'ivr-global-settings' },
      }),
    ]);

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, token } = body;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // VERSION B: MANUAL ATTENDANCE CHECK-IN
    if (action === 'MANUAL_CHECK_IN') {
      // Check existing attendance for today
      const existing = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: student.id,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: `Attendance already marked for today (${existing.status}) at ${existing.checkInTime ? new Date(existing.checkInTime).toLocaleTimeString() : 'earlier today'}.`,
            record: existing,
          },
          { status: 409 }
        );
      }

      // Check if arrival is late compared to configured grace time (e.g. 10:00)
      const graceParts = (settings?.lateArrivalGraceTime || '10:00').split(':');
      const graceMinutes = parseInt(graceParts[0], 10) * 60 + parseInt(graceParts[1] || '0', 10);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const isLate = currentMinutes > graceMinutes;
      const status = isLate ? 'LATE' : 'PRESENT';

      const newRecord = await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          batchId: student.batchId || null,
          date: startOfDay,
          status,
          method: 'MANUAL',
          checkInTime: now,
          markedBy: 'Self Check-in',
          notes: isLate
            ? `Manual Check-in marked after grace time ${settings?.lateArrivalGraceTime || '10:00'}`
            : 'Manual Check-in confirmed on time',
        },
      });

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        userRole: 'STUDENT',
        action: 'MANUAL_ATTENDANCE_CHECKIN',
        module: 'ATTENDANCE',
        details: `Student ${user.name} checked in manually as ${status} at ${now.toLocaleTimeString()}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Your attendance has been successfully marked.',
        record: newRecord,
      });
    }

    // MANUAL CHECK-OUT
    if (action === 'MANUAL_CHECK_OUT') {
      const existing = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: student.id,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (!existing) {
        return NextResponse.json({ error: 'No check-in record found for today to check out from.' }, { status: 400 });
      }

      const diffMins = Math.round(
        (now.getTime() - (existing.checkInTime ? new Date(existing.checkInTime).getTime() : now.getTime())) / 60000
      );

      const updated = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          checkOutTime: now,
          durationMinutes: diffMins,
        },
      });

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        userRole: 'STUDENT',
        action: 'MANUAL_ATTENDANCE_CHECKOUT',
        module: 'ATTENDANCE',
        details: `Student ${user.name} checked out at ${now.toLocaleTimeString()} (Total duration: ${diffMins} mins)`,
      });

      return NextResponse.json({
        success: true,
        message: 'Your check-out time has been successfully recorded.',
        record: updated,
      });
    }

    // QR CODE CHECK-IN
    if (token) {
      const verification = verifyAttendanceToken(token.trim());
      if (!verification.valid || !verification.data) {
        return NextResponse.json({ error: verification.error || 'Invalid attendance QR code' }, { status: 400 });
      }

      const { batchId, sessionId } = verification.data;
      if (student.batchId && student.batchId !== batchId) {
        return NextResponse.json({ error: 'This attendance QR code is for a different cohort batch' }, { status: 403 });
      }

      const dbSession = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
      if (!dbSession || !dbSession.isActive || dbSession.expiresAt < now) {
        return NextResponse.json({ error: 'This attendance session has ended or expired' }, { status: 410 });
      }

      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: student.id,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (existingRecord) {
        return NextResponse.json(
          {
            error: `Attendance already recorded for today (${existingRecord.status}). Duplicate scan prevented.`,
            record: existingRecord,
          },
          { status: 409 }
        );
      }

      const newRecord = await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          batchId: student.batchId || null,
          date: startOfDay,
          status: 'PRESENT',
          method: 'QR_SCAN',
          checkInTime: now,
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
        details: `Recorded PRESENT via QR scan for ${user.name} on ${startOfDay.toISOString().split('T')[0]}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Attendance successfully marked as PRESENT via verified QR code!',
        record: newRecord,
      });
    }

    return NextResponse.json({ error: 'Valid attendance action or token required.' }, { status: 400 });
  } catch (error: any) {
    console.error('Scan attendance error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process attendance' }, { status: 500 });
  }
}
