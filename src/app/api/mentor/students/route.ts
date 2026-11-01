import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized: Mentor access required' }, { status: 403 });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const students = await prisma.studentProfile.findMany({
      where: { mentorId: mentor.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, status: true } },
        batch: { select: { id: true, name: true, domain: true } },
        attendanceRecords: true,
        submissions: { include: { project: true } },
        certificate: true,
      },
      orderBy: { user: { name: 'asc' } },
    });

    const formatted = students.map((s) => {
      const totalAtt = s.attendanceRecords.length;
      const presentAtt = s.attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

      const approvedProjects = s.submissions.filter((sub) => sub.status === 'APPROVED').length;
      const totalProjects = s.submissions.length;

      return {
        id: s.id,
        userId: s.userId,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        avatar: s.user.avatar,
        status: s.user.status,
        college: s.college,
        department: s.department,
        graduationYear: s.graduationYear,
        domain: s.domain,
        batchName: s.batch?.name || 'Unassigned',
        cgpa: s.cgpa,
        resumeUrl: s.resumeUrl,
        attendancePercent,
        approvedProjects,
        totalProjects,
        hasCertificate: !!s.certificate,
        certificateNumber: s.certificate?.certificateNumber || null,
        submissions: s.submissions,
      };
    });

    return NextResponse.json({ students: formatted });
  } catch (error) {
    console.error('Mentor students error:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned students' }, { status: 500 });
  }
}
