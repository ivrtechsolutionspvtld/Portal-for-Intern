import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized: Mentor access required' }, { status: 403 });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      include: { batches: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId') || mentor.batches[0]?.id;
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all students in batch
    const students = await prisma.studentProfile.findMany({
      where: { batchId: batchId || undefined },
      include: { user: { select: { name: true, email: true } } },
    });

    // Fetch attendance for date
    const records = await prisma.attendanceRecord.findMany({
      where: {
        batchId: batchId || undefined,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const recordMap = new Map(records.map((r) => [r.studentId, r]));

    const attendanceSheet = students.map((s) => {
      const rec = recordMap.get(s.id);
      return {
        studentId: s.id,
        name: s.user.name,
        email: s.user.email,
        status: rec ? rec.status : 'ABSENT',
        method: rec ? rec.method : 'MANUAL',
        recordId: rec ? rec.id : null,
      };
    });

    return NextResponse.json({
      batches: mentor.batches,
      selectedBatchId: batchId,
      date: dateStr,
      attendanceSheet,
    });
  } catch (error) {
    console.error('Mentor attendance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance sheet' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized: Mentor access required' }, { status: 403 });
    }

    const { batchId, date, records } = await req.json();

    if (!batchId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Batch ID and records array are required' }, { status: 400 });
    }

    const recordDate = date ? new Date(date) : new Date();
    recordDate.setHours(12, 0, 0, 0);

    for (const item of records) {
      // Upsert record
      await prisma.attendanceRecord.upsert({
        where: {
          studentId_date: {
            studentId: item.studentId,
            date: recordDate,
          },
        },
        update: {
          status: item.status,
          method: 'MANUAL',
          markedBy: user.name,
        },
        create: {
          studentId: item.studentId,
          batchId,
          date: recordDate,
          status: item.status,
          method: 'MANUAL',
          markedBy: user.name,
        },
      });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'ATTENDANCE_MANUAL_MARK',
      module: 'ATTENDANCE',
      details: `Marked attendance for batch ${batchId} on ${recordDate.toISOString().split('T')[0]} (${records.length} students)`,
    });

    return NextResponse.json({ success: true, message: 'Attendance records saved successfully' });
  } catch (error) {
    console.error('Save attendance error:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
