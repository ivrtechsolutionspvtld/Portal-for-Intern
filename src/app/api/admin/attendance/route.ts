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
    const courseId = searchParams.get('courseId') || '';
    const mentorId = searchParams.get('mentorId') || '';
    const batchId = searchParams.get('batchId') || '';
    const dateStr = searchParams.get('date') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search')?.toLowerCase().trim() || '';

    const whereClause: any = {};
    if (batchId && batchId !== 'ALL') whereClause.batchId = batchId;
    if (status && status !== 'ALL') whereClause.status = status;

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = { gte: startOfDay, lte: endOfDay };
    }

    if (courseId && courseId !== 'ALL') {
      whereClause.student = { ...whereClause.student, courseId };
    }

    if (mentorId && mentorId !== 'ALL') {
      whereClause.student = { ...whereClause.student, mentorId };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            course: { select: { id: true, title: true, code: true } },
            mentor: { include: { user: { select: { name: true, email: true } } } },
            batch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const filtered = search
      ? records.filter((r) => {
          const sName = r.student?.user?.name?.toLowerCase() || '';
          const sEmail = r.student?.user?.email?.toLowerCase() || '';
          const sId = r.student?.studentId?.toLowerCase() || '';
          const cTitle = r.student?.course?.title?.toLowerCase() || '';
          const mName = r.student?.mentor?.user?.name?.toLowerCase() || '';
          return sName.includes(search) || sEmail.includes(search) || sId.includes(search) || cTitle.includes(search) || mName.includes(search);
        })
      : records;

    // Compute metrics
    const totalRecords = filtered.length;
    const presentCount = filtered.filter((r) => r.status === 'PRESENT').length;
    const lateCount = filtered.filter((r) => r.status === 'LATE').length;
    const absentCount = filtered.filter((r) => r.status === 'ABSENT').length;
    const excusedCount = filtered.filter((r) => r.status === 'EXCUSED').length;

    const formatted = filtered.map((r) => ({
      id: r.id,
      studentId: r.student.studentId || 'Pending',
      studentName: r.student.user.name,
      studentEmail: r.student.user.email,
      courseTitle: r.student.course?.title || r.student.domain || 'Unassigned',
      mentorName: r.student.mentor?.user?.name || 'Unassigned',
      batchName: r.student.batch?.name || 'N/A',
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      method: r.method,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      durationMinutes: r.durationMinutes,
      markedBy: r.markedBy,
      notes: r.notes,
      correctionReason: r.correctionReason,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      records: formatted,
      stats: {
        totalRecords,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        effectiveRate: totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 100,
      },
    });
  } catch (error: any) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST: Admin manually records attendance
export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { studentProfileId, date, status, notes, reason } = await req.json();

    if (!studentProfileId || !date || !status) {
      return NextResponse.json({ error: 'Student ID, date, and attendance status are required.' }, { status: 400 });
    }

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'A mandatory administrative authorization reason is required.' }, { status: 400 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let record: any;
    if (existing) {
      record = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          status,
          method: 'ADMIN_MANUAL',
          markedBy: `Admin: ${adminUser.name}`,
          notes: notes?.trim() || `Manual attendance recorded by admin`,
          correctionReason: reason.trim(),
        },
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          batchId: student.batchId || null,
          date: startOfDay,
          status,
          method: 'ADMIN_MANUAL',
          checkInTime: new Date(),
          markedBy: `Admin: ${adminUser.name}`,
          notes: notes?.trim() || `Manual entry by administrator`,
          correctionReason: reason.trim(),
        },
      });
    }

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'ADMIN_MANUAL_ATTENDANCE',
      module: 'ATTENDANCE',
      details: `Admin ${adminUser.name} marked ${status} for ${student.user.name} on ${date}. Authorization reason: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance record successfully saved as ${status}.`,
      record,
    });
  } catch (err: any) {
    console.error('Manual attendance error:', err);
    return NextResponse.json({ error: err.message || 'Failed to record manual attendance' }, { status: 500 });
  }
}

// PUT: Admin corrects attendance record with mandatory reason
export async function PUT(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { recordId, status, notes, correctionReason } = await req.json();

    if (!recordId || !status) {
      return NextResponse.json({ error: 'Record ID and new status are required' }, { status: 400 });
    }

    if (!correctionReason?.trim()) {
      return NextResponse.json(
        { error: 'Mandatory Compliance Rule: An explicit reason must be provided for correcting an attendance record.' },
        { status: 400 }
      );
    }

    const existing = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: { student: { include: { user: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status,
        correctionReason: correctionReason.trim(),
        notes: notes?.trim() || `Corrected by administrator ${adminUser.name}`,
        markedBy: `${adminUser.name} (Admin Override)`,
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'ATTENDANCE_CORRECTION',
      module: 'ATTENDANCE',
      details: `Corrected attendance for ${existing.student.user.name} (${existing.student.studentId}) on ${existing.date.toISOString().split('T')[0]} from ${existing.status} to ${status}. Mandatory reason: ${correctionReason.trim()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record updated successfully with audit trail.',
      record: updated,
    });
  } catch (error: any) {
    console.error('Attendance update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update attendance record' }, { status: 500 });
  }
}
