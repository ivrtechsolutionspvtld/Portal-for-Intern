import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: { select: { progress: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'CREATE_COURSE') {
      const { title, domain, description, durationWeeks, level, thumbnail } = body;
      if (!title || !domain || !description) {
        return NextResponse.json({ error: 'Title, domain, and description are required' }, { status: 400 });
      }

      const newCourse = await prisma.course.create({
        data: {
          title: title.trim(),
          domain,
          description: description.trim(),
          durationWeeks: durationWeeks ? parseInt(durationWeeks, 10) : 8,
          level: level || 'Intermediate',
          thumbnail: thumbnail || null,
        },
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'COURSE_CREATE',
        module: 'COURSE_MANAGEMENT',
        details: `Created curriculum ${title} for domain ${domain}`,
      });

      return NextResponse.json({ success: true, course: newCourse });
    }

    if (action === 'ADD_MODULE') {
      const { courseId, title, description, orderIndex, durationMinutes, videoUrl, pdfUrl, notes } = body;
      if (!courseId || !title || !description) {
        return NextResponse.json({ error: 'Course ID, title, and description are required' }, { status: 400 });
      }

      const newModule = await prisma.module.create({
        data: {
          courseId,
          title: title.trim(),
          description: description.trim(),
          orderIndex: orderIndex ? parseInt(orderIndex, 10) : 1,
          durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 45,
          videoUrl: videoUrl || null,
          pdfUrl: pdfUrl || null,
          notes: notes || null,
        },
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'MODULE_CREATE',
        module: 'COURSE_MANAGEMENT',
        details: `Added module ${title} to course ${courseId}`,
      });

      return NextResponse.json({ success: true, module: newModule });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Course management error:', error);
    return NextResponse.json({ error: 'Failed to manage course' }, { status: 500 });
  }
}
