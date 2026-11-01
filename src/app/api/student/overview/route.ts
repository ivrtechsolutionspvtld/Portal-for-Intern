import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        batch: {
          include: {
            mentor: { include: { user: { select: { name: true, email: true, avatar: true } } } },
          },
        },
        mentor: {
          include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
        },
        attendanceRecords: {
          orderBy: { date: 'desc' },
        },
        submissions: {
          include: { project: true },
        },
        courseProgress: true,
        certificate: true,
        paymentOrders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Attendance calculation
    const totalAtt = student.attendanceRecords.length;
    const presentAtt = student.attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    // Course modules total count for student's domain
    const course = await prisma.course.findFirst({
      where: { domain: student.domain },
      include: { modules: true },
    });

    const totalModules = course?.modules.length || 4;
    const completedModules = student.courseProgress.filter((p) => p.completed).length;
    const learningProgressPercent = Math.round((completedModules / totalModules) * 100);

    // Pending assignments / projects
    const batchProjects = student.batchId
      ? await prisma.project.findMany({
          where: { batchId: student.batchId },
          include: {
            submissions: {
              where: { studentId: student.id },
            },
          },
        })
      : [];

    const pendingAssignments = batchProjects.filter((p) => p.submissions.length === 0 || p.submissions[0].status === 'REVISION_REQUESTED');

    // Recent announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [{ targetAudience: 'ALL' }, { batchId: student.batchId || undefined }],
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    // Certificate eligibility check
    const isAttendanceEligible = attendancePercent >= 80;
    const isProjectEligible = batchProjects.length > 0 && batchProjects.every((p) => p.submissions[0]?.status === 'APPROVED');
    const isPaymentEligible = student.paymentOrders.some((p) => p.feeType === 'PROGRAM_FEE' && p.status === 'SUCCESS');
    const certificateEligibility = {
      isEligible: isAttendanceEligible && isProjectEligible,
      criteria: {
        attendance: { met: isAttendanceEligible, current: `${attendancePercent}%`, required: '80%' },
        projects: { met: isProjectEligible, current: `${batchProjects.filter((p) => p.submissions[0]?.status === 'APPROVED').length}/${batchProjects.length} Completed`, required: 'All Milestones' },
        feePayment: { met: isPaymentEligible, current: isPaymentEligible ? 'Paid' : 'Pending', required: 'Settled' },
      },
      hasCertificate: !!student.certificate,
      certificateNumber: student.certificate?.certificateNumber || null,
    };

    return NextResponse.json({
      student: {
        id: student.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        college: student.college,
        department: student.department,
        graduationYear: student.graduationYear,
        domain: student.domain,
        enrollmentDate: student.enrollmentDate,
        batch: student.batch ? { id: student.batch.id, name: student.batch.name, startDate: student.batch.startDate, endDate: student.batch.endDate } : null,
        mentor: student.mentor ? { name: student.mentor.user.name, email: student.mentor.user.email, phone: student.mentor.user.phone, avatar: student.mentor.user.avatar, designation: student.mentor.designation } : null,
      },
      metrics: {
        attendancePercent,
        learningProgressPercent,
        totalClasses: totalAtt,
        presentClasses: presentAtt,
        completedModules,
        totalModules,
        pendingAssignmentsCount: pendingAssignments.length,
      },
      recentAttendance: student.attendanceRecords.slice(0, 5),
      pendingAssignments: pendingAssignments.map((p) => ({
        id: p.id,
        title: p.title,
        deadline: p.deadline,
        maxScore: p.maxScore,
        submissionStatus: p.submissions[0]?.status || 'NOT_SUBMITTED',
      })),
      announcements,
      certificateEligibility,
    });
  } catch (error) {
    console.error('Student overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch student dashboard overview' }, { status: 500 });
  }
}
