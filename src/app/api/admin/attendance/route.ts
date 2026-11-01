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
    const batchId = searchParams.get('batchId') || '';
    const dateStr = searchParams.get('date') || '';
    const studentId = searchParams.get('studentId') || '';

    const whereClause: Record<string, unknown> = {};
    if (batchId) whereClause.batchId = batchId;
    if (studentId) whereClause.studentId = studentId;
    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = { gte: startOfDay, lte: endOfDay };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            batch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    // Compute batch statistics
    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;

    const formatted = records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.user.name,
      studentEmail: r.student.user.email,
      batchName: r.student.batch?.name || 'Unassigned',
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      method: r.method,
      markedBy: r.markedBy,
      notes: r.notes,
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
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { recordId, status, notes } = await req.json();

    if (!recordId || !status) {
      return NextResponse.json({ error: 'Record ID and new status are required' }, { status: 400 });
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
        notes: notes || `Admin correction by ${adminUser.name}`,
        markedBy: `${adminUser.name} (Admin Override)`,
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'ATTENDANCE_CORRECTION',
      module: 'ATTENDANCE',
      details: `Corrected attendance for ${existing.student.user.name} on ${existing.date.toISOString().split('T')[0]} from ${existing.status} to ${status}. Notes: ${notes || 'Admin manual correction'}`,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    console.error('Attendance update error:', error);
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 });
  }
}
