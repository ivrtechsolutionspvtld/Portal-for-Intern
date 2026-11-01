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

    // 2. Applications
    const pendingApplications = await prisma.application.count({
      where: { status: 'PENDING' },
    });
    const approvedApplications = await prisma.application.count({
      where: { status: 'APPROVED' },
    });

    // 3. Mentors & Batches
    const totalMentors = await prisma.mentorProfile.count();
    const activeBatches = await prisma.batch.count({
      where: { status: 'ACTIVE' },
    });

    // 4. Completed Internships (Certificates issued)
    const completedInternships = await prisma.certificate.count({
      where: { status: 'VALID' },
    });

    // 5. Attendance Calculation
    const totalAttendanceRecords = await prisma.attendanceRecord.count();
    const presentRecords = await prisma.attendanceRecord.count({
      where: { status: { in: ['PRESENT', 'LATE'] } },
    });
    const overallAttendanceRate =
      totalAttendanceRecords > 0
        ? Math.round((presentRecords / totalAttendanceRecords) * 100)
        : 0;

    // 6. Project Submissions
    const pendingSubmissions = await prisma.projectSubmission.count({
      where: { status: 'SUBMITTED' },
    });
    const approvedSubmissions = await prisma.projectSubmission.count({
      where: { status: 'APPROVED' },
    });

    // 7. Payment Analytics
    const paidOrders = await prisma.paymentOrder.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true },
    });
    const totalRevenueINR = paidOrders.reduce((acc, curr) => acc + curr.amount, 0);

    const pendingOrdersCount = await prisma.paymentOrder.count({
      where: { status: 'PENDING' },
    });

    // 8. Recent Activities (Audit Logs)
    const recentActivities = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { timestamp: 'desc' },
    });

    // 9. Upcoming Deadlines (Projects)
    const upcomingDeadlines = await prisma.project.findMany({
      where: { deadline: { gte: new Date() } },
      take: 4,
      orderBy: { deadline: 'asc' },
      include: { batch: true },
    });

    // 10. Domain Breakdown
    const studentsByDomain = await prisma.studentProfile.groupBy({
      by: ['domain'],
      _count: { id: true },
    });

    return NextResponse.json({
      metrics: {
        totalStudents,
        activeStudents,
        pendingApplications,
        approvedApplications,
        completedInternships,
        totalMentors,
        activeBatches,
        totalAttendanceRecords,
        overallAttendanceRate,
        pendingSubmissions,
        approvedSubmissions,
        totalRevenueINR,
        pendingOrdersCount,
      },
      recentActivities,
      upcomingDeadlines,
      domainDistribution: studentsByDomain.map((d) => ({
        domain: d.domain,
        count: d._count.id,
      })),
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Failed to load admin overview metrics' }, { status: 500 });
  }
}
