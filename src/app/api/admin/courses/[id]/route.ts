import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: { orderBy: { orderIndex: 'asc' } },
        students: {
          include: {
            user: { select: { id: true, name: true, email: true, status: true } },
            mentor: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error('Course detail fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, code, domain, description, department, durationWeeks, level, syllabus, status } = body;

    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(code !== undefined && { code: code.trim() }),
        ...(domain !== undefined && { domain: domain.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(department !== undefined && { department: department.trim() }),
        ...(durationWeeks !== undefined && { durationWeeks: parseInt(durationWeeks, 10) }),
        ...(level !== undefined && { level }),
        ...(syllabus !== undefined && { syllabus: syllabus.trim() }),
        ...(status !== undefined && { status }),
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'COURSE_UPDATED',
      module: 'COURSE_MANAGEMENT',
      details: `Updated course: ${updatedCourse.title} (${updatedCourse.code}), Status: ${updatedCourse.status}`,
    });

    return NextResponse.json({ success: true, course: updatedCourse });
  } catch (error: any) {
    console.error('Course update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const enrolledStudents = await prisma.studentProfile.count({
      where: { courseId: id },
    });

    if (enrolledStudents > 0) {
      return NextResponse.json(
        { error: `Cannot delete course with ${enrolledStudents} active enrolled students. Deactivate course instead.` },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    await prisma.course.delete({ where: { id } });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'COURSE_DELETED',
      module: 'COURSE_MANAGEMENT',
      details: `Deleted course ${course.title} (${course.code})`,
    });

    return NextResponse.json({ success: true, message: 'Course successfully deleted.' });
  } catch (error: any) {
    console.error('Course delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete course' }, { status: 500 });
  }
}

