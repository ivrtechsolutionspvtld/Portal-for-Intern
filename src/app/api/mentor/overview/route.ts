import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized: Mentor access required' }, { status: 403 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      include: {
        batches: true,
        assignedStudents: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            batch: true,
            submissions: { include: { project: true } },
            attendanceRecords: true,
            certificate: true,
          },
        },
      },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    // Pending submissions from assigned students
    const studentProfileIds = mentorProfile.assignedStudents.map((s) => s.id);
    const pendingSubmissions = await prisma.projectSubmission.findMany({
      where: {
        studentId: { in: studentProfileIds },
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
      },
      include: {
        project: true,
        student: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Upcoming deadlines for mentor's batches
    const batchIds = mentorProfile.batches.map((b) => b.id);
    const upcomingProjects = await prisma.project.findMany({
      where: {
        batchId: { in: batchIds },
        deadline: { gte: new Date() },
      },
      orderBy: { deadline: 'asc' },
      take: 4,
    });

    // Compute average attendance across assigned students
    let totalRecords = 0;
    let presentRecords = 0;
    mentorProfile.assignedStudents.forEach((s) => {
      totalRecords += s.attendanceRecords.length;
      presentRecords += s.attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    });

    const averageAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    return NextResponse.json({
      mentor: {
        id: mentorProfile.id,
        name: user.name,
        designation: mentorProfile.designation,
        department: mentorProfile.department,
        expertise: mentorProfile.expertise,
        totalAssignedStudents: mentorProfile.assignedStudents.length,
        maxStudents: mentorProfile.maxStudents,
      },
      metrics: {
        totalStudents: mentorProfile.assignedStudents.length,
        totalBatches: mentorProfile.batches.length,
        pendingSubmissionsCount: pendingSubmissions.length,
        totalRecords,
        averageAttendance,
      },
      batches: mentorProfile.batches,
      pendingSubmissions,
      upcomingProjects,
    });
  } catch (error) {
    console.error('Mentor overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch mentor dashboard overview' }, { status: 500 });
  }
}
