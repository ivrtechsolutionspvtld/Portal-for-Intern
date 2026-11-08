import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    const where: any = {};
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { domain: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            modules: true,
          },
        },
        modules: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, courses });
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
    const { action = 'CREATE_COURSE' } = body;

    if (action === 'CREATE_COURSE') {
      const {
        code,
        title,
        domain,
        description,
        department = 'Software Engineering',
        durationWeeks = 8,
        level = 'Intermediate',
        syllabus,
        status = 'ACTIVE',
      } = body;

      if (!title || !description) {
        return NextResponse.json({ error: 'Course title and description are required.' }, { status: 400 });
      }

      const generatedCode = code?.trim() || `IVR-CRS-${Date.now().toString(36).toUpperCase()}`;

      // Check unique code
      const existing = await prisma.course.findUnique({
        where: { code: generatedCode },
      });
      if (existing) {
        return NextResponse.json({ error: `A course with code ${generatedCode} already exists.` }, { status: 409 });
      }

      const newCourse = await prisma.course.create({
        data: {
          code: generatedCode,
          title: title.trim(),
          domain: domain?.trim() || title.trim(),
          description: description.trim(),
          department: department.trim(),
          durationWeeks: parseInt(durationWeeks, 10) || 8,
          level: level || 'Intermediate',
          syllabus: syllabus?.trim() || null,
          status: status || 'ACTIVE',
        },
      });

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'COURSE_CREATED',
        module: 'COURSE_MANAGEMENT',
        details: `Created course: ${newCourse.title} (${newCourse.code}) in department ${newCourse.department}`,
      });

      return NextResponse.json({ success: true, course: newCourse });
    }

    if (action === 'ADD_MODULE') {
      const { courseId, title, description, orderIndex, durationMinutes, videoUrl, pdfUrl, notes } = body;
      if (!courseId || !title || !description) {
        return NextResponse.json({ error: 'Course ID, module title, and description are required' }, { status: 400 });
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
        action: 'MODULE_CREATED',
        module: 'COURSE_MANAGEMENT',
        details: `Added module ${title} to course ID ${courseId}`,
      });

      return NextResponse.json({ success: true, module: newModule });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create course' }, { status: 500 });
  }
}
