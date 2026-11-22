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

    // Strict access control: Query ONLY students assigned to this mentor
    const students = await prisma.studentProfile.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
        },
        batch: { select: { id: true, name: true, domain: true } },
        course: { select: { id: true, title: true, code: true } },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        submissions: {
          include: { project: true },
          orderBy: { submittedAt: 'desc' },
        },
        certificate: true,
        mentorNotes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        quizAttempts: {
          include: { quiz: { select: { title: true } } },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const formatted = students.map((s) => {
      const totalAtt = s.attendanceRecords.length;
      const presentAtt = s.attendanceRecords.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

      const approvedProjects = s.submissions.filter((sub) => sub.status === 'APPROVED').length;
      const totalProjects = s.submissions.length;

      return {
        id: s.id,
        userId: s.userId,
        studentId: s.studentId,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        avatar: s.user.avatar,
        status: s.user.status,
        college: s.college,
        department: s.department,
        degree: s.degree,
        academicYear: s.academicYear,
        graduationYear: s.graduationYear,
        regNumber: s.regNumber,
        domain: s.domain,
        courseTitle: s.course?.title || s.domain,
        batchId: s.batchId,
        batchName: s.batch?.name || 'Unassigned',
        cgpa: s.cgpa,
        resumeUrl: s.resumeUrl,
        enrollmentDate: s.enrollmentDate,
        attendancePercent,
        attendanceTotal: totalAtt,
        attendancePresent: presentAtt,
        attendanceStatus: attendancePercent >= 75 ? 'ELIGIBLE' : 'AT_RISK',
        approvedProjects,
        totalProjects,
        hasCertificate: !!s.certificate,
        certificateNumber: s.certificate?.certificateNumber || null,
        submissions: s.submissions,
        notesCount: s.mentorNotes.length,
        quizAttemptsCount: s.quizAttempts.length,
      };
    });

    return NextResponse.json({
      success: true,
      mentor: {
        id: mentorProfile.id,
        name: auth.data.user.name,
        designation: mentorProfile.designation,
      },
      count: formatted.length,
      students: formatted,
    });
  } catch (error: any) {
    console.error('Mentor students fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assigned students' },
      { status: 500 }
    );
  }
}
