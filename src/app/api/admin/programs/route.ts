import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (courseId && courseId !== 'ALL') {
      where.courseId = courseId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { techStack: { contains: search, mode: 'insensitive' } },
      ];
    }

    const programs = await prisma.internshipProgram.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            domain: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { success: true, programs },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Admin programs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch internship programs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      domain,
      courseId,
      duration = '8 Weeks',
      level = 'Intermediate',
      techStack,
      projects,
      stipend = 'Performance Based',
      mode = 'Virtual / Remote',
      status = 'ACTIVE',
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Program title and description are required' }, { status: 400 });
    }

    // Determine domain from linked course if not explicitly provided
    let finalDomain = domain ? domain.trim() : '';
    if (!finalDomain && courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (course) {
        finalDomain = course.domain || course.title;
      }
    }
    if (!finalDomain) {
      finalDomain = title.trim();
    }

    const newProgram = await prisma.internshipProgram.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        domain: finalDomain,
        courseId: courseId || null,
        duration: duration.trim(),
        level: level.trim(),
        techStack: techStack ? techStack.trim() : null,
        projects: projects ? projects.trim() : null,
        stipend: stipend ? stipend.trim() : 'Performance Based',
        mode: mode ? mode.trim() : 'Virtual / Remote',
        status: status || 'ACTIVE',
      },
      include: {
        course: true,
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'PROGRAM_CREATED',
      module: 'INTERNSHIP_PROGRAMS',
      details: `Created internship program: ${newProgram.title} (Domain: ${newProgram.domain}, Status: ${newProgram.status})`,
    });

    return NextResponse.json(
      { success: true, program: newProgram },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Program creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create internship program' }, { status: 500 });
  }
}

