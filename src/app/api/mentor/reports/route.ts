import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { mentorProfile } = auth.data;

    // Fetch assigned students with all academic metrics
    const students = await prisma.studentProfile.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        batch: { select: { id: true, name: true, domain: true } },
        course: { select: { id: true, title: true } },
        attendanceRecords: true,
        submissions: { include: { project: true } },
        quizAttempts: true,
        courseProgress: true,
        certificate: true,
        certificateRecommendations: {
          where: { mentorId: mentorProfile.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    let totalAttendancePercentSum = 0;
    let totalApprovedSubmissions = 0;
    let totalPassedQuizzes = 0;
    let eligibleStudentsCount = 0;

    const studentReports = students.map((s) => {
      // 1. Attendance calculations
      const totalAtt = s.attendanceRecords.length;
      const presentAtt = s.attendanceRecords.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;
      totalAttendancePercentSum += attendancePercent;

      // 2. Submissions calculations
      const totalSubs = s.submissions.length;
      const approvedSubs = s.submissions.filter((sub) => sub.status === 'APPROVED').length;
      const avgScore =
        approvedSubs > 0
          ? Math.round(
              s.submissions
                .filter((sub) => sub.score !== null)
                .reduce((acc, sub) => acc + (sub.score || 0), 0) /
                (s.submissions.filter((sub) => sub.score !== null).length || 1)
            )
          : null;
      totalApprovedSubmissions += approvedSubs;

      // 3. Quizzes calculations
      const totalQuizzes = s.quizAttempts.length;
      const passedQuizzes = s.quizAttempts.filter((q) => q.passed).length;
      totalPassedQuizzes += passedQuizzes;

      // 4. Learning Modules progress
      const completedModules = s.courseProgress.filter((cp) => cp.completed).length;

      // 5. Overall eligibility
      const isEligible = attendancePercent >= 75 && approvedSubs >= 1;
      if (isEligible) eligibleStudentsCount++;

      const latestRec = s.certificateRecommendations[0] || null;

      return {
        id: s.id,
        userId: s.userId,
        studentId: s.studentId,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        college: s.college,
        department: s.department,
        domain: s.domain,
        batchName: s.batch?.name || 'Unassigned',
        attendance: {
          totalDays: totalAtt,
          presentDays: presentAtt,
          percentage: attendancePercent,
          status: attendancePercent >= 75 ? 'ELIGIBLE' : 'AT_RISK',
        },
        projects: {
          total: totalSubs,
          approved: approvedSubs,
          averageScore: avgScore,
        },
        quizzes: {
          attempts: totalQuizzes,
          passed: passedQuizzes,
        },
        learning: {
          completedModules,
        },
        certificate: {
          hasCertificate: !!s.certificate,
          certificateNumber: s.certificate?.certificateNumber || null,
          recommendationStatus: latestRec ? latestRec.status : 'NOT_RECOMMENDED',
          recommendationRating: latestRec?.performanceRating || null,
        },
        isEligible,
      };
    });

    const averageCohortAttendance =
      students.length > 0 ? Math.round(totalAttendancePercentSum / students.length) : 100;

    return NextResponse.json({
      success: true,
      summary: {
        totalStudents: students.length,
        averageCohortAttendance,
        totalApprovedSubmissions,
        totalPassedQuizzes,
        eligibleStudentsCount,
        maxCapacity: mentorProfile.maxStudents || 30,
        workloadPercentage: Math.round(
          (students.length / (mentorProfile.maxStudents || 30)) * 100
        ),
      },
      reports: studentReports,
    });
  } catch (error: any) {
    console.error('Mentor reports fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cohort reports' },
      { status: 500 }
    );
  }
}

