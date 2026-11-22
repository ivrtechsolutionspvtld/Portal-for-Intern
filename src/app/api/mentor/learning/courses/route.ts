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

    // Get courses assigned to this mentor or matching mentor's expertise
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { mentors: { some: { id: mentorProfile.id } } },
          { domain: mentorProfile.department || mentorProfile.expertise },
          { status: 'ACTIVE' },
        ],
      },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: { select: { progress: true } },
          },
        },
        _count: { select: { students: true } },
      },
      orderBy: { title: 'asc' },
    });

    // Also get mentor's assigned students progress summary
    const assignedStudents = await prisma.studentProfile.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        user: { select: { name: true, email: true } },
        courseProgress: {
          include: { module: { select: { id: true, title: true, courseId: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      courses,
      assignedStudentsCount: assignedStudents.length,
      assignedStudentsProgress: assignedStudents.map((s) => ({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        completedModules: s.courseProgress.filter((p) => p.completed).length,
        totalModulesTracked: s.courseProgress.length,
      })),
    });
  } catch (error: any) {
    console.error('Mentor courses fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch learning hub courses' },
      { status: 500 }
    );
  }
}

