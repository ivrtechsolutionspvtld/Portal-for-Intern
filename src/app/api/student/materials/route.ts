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
        courseProgress: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Find course matching student's domain
    const course = await prisma.course.findFirst({
      where: { domain: student.domain },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ course: null, modules: [] });
    }

    const progressMap = new Map(student.courseProgress.map((p) => [p.moduleId, p]));

    const formattedModules = course.modules.map((m) => {
      const prog = progressMap.get(m.id);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        orderIndex: m.orderIndex,
        durationMinutes: m.durationMinutes,
        videoUrl: m.videoUrl,
        pdfUrl: m.pdfUrl,
        notes: m.notes,
        isCompleted: prog ? prog.completed : false,
        completedAt: prog?.completedAt || null,
      };
    });

    const total = formattedModules.length;
    const completed = formattedModules.filter((m) => m.isCompleted).length;

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        domain: course.domain,
        description: course.description,
        durationWeeks: course.durationWeeks,
        level: course.level,
        thumbnail: course.thumbnail,
      },
      modules: formattedModules,
      stats: {
        totalModules: total,
        completedModules: completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Learning materials fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch learning materials' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { moduleId, completed } = await req.json();

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    const isDone = completed !== undefined ? Boolean(completed) : true;

    const progress = await prisma.courseProgress.upsert({
      where: {
        studentId_moduleId: {
          studentId: student.id,
          moduleId,
        },
      },
      update: {
        completed: isDone,
        completedAt: isDone ? new Date() : null,
      },
      create: {
        studentId: student.id,
        moduleId,
        completed: isDone,
        completedAt: isDone ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Module complete error:', error);
    return NextResponse.json({ error: 'Failed to update module progress' }, { status: 500 });
  }
}
