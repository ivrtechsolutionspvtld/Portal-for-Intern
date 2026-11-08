import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // 1. Student Counts
    const totalStudents = await prisma.studentProfile.count();
    const activeStudents = await prisma.user.count({
      where: { role: 'STUDENT', status: 'ACTIVE' },
    });
    const pendingStudentApprovals = await prisma.user.count({
      where: { role: 'STUDENT', status: 'PENDING_APPROVAL' },
    });

    // 2. Mentors
    const totalMentors = await prisma.mentorProfile.count();
    const activeMentors = await prisma.user.count({
      where: { role: 'MENTOR', status: 'ACTIVE' },
    });
    const pendingMentorApprovals = await prisma.user.count({
      where: { role: 'MENTOR', status: 'PENDING_APPROVAL' },
    });

    // 3. Allocation Gaps
    const awaitingCourseAllocation = await prisma.studentProfile.count({
      where: {
        OR: [
          { courseId: null },
          { domain: 'Pending Course Allocation' },
        ],
      },
    });
    const awaitingMentorAssignment = await prisma.studentProfile.count({
      where: { mentorId: null },
    });

    // 4. Applications Pipeline
    const totalApplications = await prisma.application.count();
    const pendingApplications = await prisma.application.count({
      where: { status: 'PENDING' },
    });
    const approvedApplications = await prisma.application.count({
      where: { status: 'APPROVED' },
    });
    const rejectedApplications = await prisma.application.count({
      where: { status: 'REJECTED' },
    });

    // 5. Course Enrollment Overview
    const courseEnrollments = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        department: true,
        durationWeeks: true,
        _count: { select: { students: true } },
      },
      orderBy: { students: { _count: 'desc' } },
      take: 8,
    });

    // 6. Attendance Analytics (Today & Overall)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [todayPresent, todayLate, todayAbsent, totalAttendanceRecords, overallPresentCount] = await Promise.all([
      prisma.attendanceRecord.count({
        where: { date: { gte: startOfToday, lte: endOfToday }, status: 'PRESENT' },
      }),
      prisma.attendanceRecord.count({
        where: { date: { gte: startOfToday, lte: endOfToday }, status: 'LATE' },
      }),
      prisma.attendanceRecord.count({
        where: { date: { gte: startOfToday, lte: endOfToday }, status: 'ABSENT' },
      }),
      prisma.attendanceRecord.count(),
      prisma.attendanceRecord.count({
        where: { status: { in: ['PRESENT', 'LATE'] } },
      }),
    ]);

    const overallAttendanceRate =
      totalAttendanceRecords > 0
        ? Math.round((overallPresentCount / totalAttendanceRecords) * 100)
        : 100;

    // 7. Internship Progress / Deliverables
    const completedInternships = await prisma.certificate.count({
      where: { status: 'VALID' },
    });
    const pendingSubmissions = await prisma.projectSubmission.count({
      where: { status: 'SUBMITTED' },
    });
    const approvedSubmissions = await prisma.projectSubmission.count({
      where: { status: 'APPROVED' },
    });

    // 8. Recent Administrator Activities (Audit Logs)
    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, role: true } },
      },
    });

    // 9. Mentor Workload Analytics
    const mentorWorkloads = await prisma.mentorProfile.findMany({
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { assignedStudents: true } },
      },
      orderBy: { assignedStudents: { _count: 'desc' } },
    });

    return NextResponse.json({
      metrics: {
        totalStudents,
        activeStudents,
        pendingStudentApprovals,
        totalMentors,
        activeMentors,
        pendingMentorApprovals,
        awaitingCourseAllocation,
        awaitingMentorAssignment,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        completedInternships,
        pendingSubmissions,
        approvedSubmissions,
        todayAttendance: {
          present: todayPresent,
          late: todayLate,
          absent: todayAbsent,
          totalToday: todayPresent + todayLate + todayAbsent,
        },
        overallAttendance: {
          totalRecords: totalAttendanceRecords,
          ratePercent: overallAttendanceRate,
        },
      },
      courseEnrollments,
      mentorWorkloads,
      recentActivities,
    });
  } catch (error: any) {
    console.error('Overview metrics error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
