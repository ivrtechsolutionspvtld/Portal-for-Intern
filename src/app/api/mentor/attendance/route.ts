import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user, mentorProfile } = auth.data;

    // Fetch batches assigned to this mentor
    const batches = await prisma.batch.findMany({
      where: { mentorId: mentorProfile.id },
      select: { id: true, name: true, domain: true },
    });

    const { searchParams } = new URL(req.url);
    const requestedBatchId = searchParams.get('batchId');
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    let batchId: string | null = null;

    if (requestedBatchId) {
      // Security check: Verify mentor owns this batch
      const batch = await prisma.batch.findUnique({
        where: { id: requestedBatchId },
      });
      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }
      if (batch.mentorId && batch.mentorId !== mentorProfile.id) {
        return NextResponse.json(
          { error: 'Forbidden: You are not authorized to view attendance for this cohort/batch.' },
          { status: 403 }
        );
      }
      batchId = requestedBatchId;
    } else if (batches.length > 0) {
      batchId = batches[0].id;
    }

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch students: either in mentor's selected batch or assigned to this mentor directly
    const students = await prisma.studentProfile.findMany({
      where: batchId
        ? { batchId, mentorId: mentorProfile.id }
        : { mentorId: mentorProfile.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { user: { name: 'asc' } },
    });

    // Fetch attendance for date
    const studentIds = students.map((s) => s.id);
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: studentIds },
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
      success: true,
      batches,
      selectedBatchId: batchId,
      date: dateStr,
      attendanceSheet,
    });
  } catch (error: any) {
    console.error('Mentor attendance fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance sheet' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user, mentorProfile } = auth.data;
    const { batchId, date, records } = await req.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Records array is required' }, { status: 400 });
    }

    // Security check: Verify all students in records are assigned to this mentor
    const studentIds = records.map((r: any) => r.studentId);
    const authorizedStudents = await prisma.studentProfile.findMany({
      where: {
        id: { in: studentIds },
        mentorId: mentorProfile.id,
      },
      select: { id: true, userId: true },
    });

    if (authorizedStudents.length !== studentIds.length) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        userRole: 'MENTOR',
        action: 'SECURITY_VIOLATION_UNAUTHORIZED_ATTENDANCE_MARK',
        module: 'ATTENDANCE',
        details: `Mentor ${user.email} attempted to mark attendance for unauthorized students.`,
      });

      return NextResponse.json(
        {
          error:
            'Forbidden: One or more selected students are not assigned to you. You cannot mark attendance for them.',
        },
        { status: 403 }
      );
    }

    const recordDate = date ? new Date(date) : new Date();
    recordDate.setHours(12, 0, 0, 0);

    for (const item of records) {
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
          batchId: batchId || undefined,
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
      details: `Marked attendance for ${records.length} assigned students on ${recordDate.toISOString().split('T')[0]}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance records saved successfully with security validation.',
    });
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save attendance' },
      { status: 500 }
    );
  }
}
