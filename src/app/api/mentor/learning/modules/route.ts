import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user, mentorProfile } = auth.data;
    const body = await req.json();
    const {
      courseId,
      title,
      description,
      orderIndex,
      durationMinutes = 45,
      videoUrl,
      pdfUrl,
      notes,
      status = 'PUBLISHED',
    } = body;

    if (!courseId || !title || !description) {
      return NextResponse.json(
        { error: 'Course ID, module title, and description are required.' },
        { status: 400 }
      );
    }

    // Determine orderIndex if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const highestModule = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { orderIndex: 'desc' },
      });
      finalOrderIndex = (highestModule?.orderIndex ?? 0) + 1;
    }

    const newModule = await prisma.module.create({
      data: {
        courseId,
        title: title.trim(),
        description: description.trim(),
        orderIndex: Number(finalOrderIndex),
        durationMinutes: Number(durationMinutes) || 45,
        videoUrl: videoUrl ? videoUrl.trim() : null,
        pdfUrl: pdfUrl ? pdfUrl.trim() : null,
        notes: notes ? notes.trim() : null,
        status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      },
      include: {
        course: { select: { title: true, domain: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'CREATE_LEARNING_MODULE',
      module: 'LEARNING_HUB',
      details: `Created module "${newModule.title}" in course "${newModule.course.title}" with status ${newModule.status}.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Learning module created successfully.',
      module: newModule,
    });
  } catch (error: any) {
    console.error('Create module error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create module' },
      { status: 500 }
    );
  }
}

