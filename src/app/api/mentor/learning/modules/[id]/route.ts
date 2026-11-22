import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth.data;
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.module.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Learning module not found.' }, { status: 404 });
    }

    const updated = await prisma.module.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        orderIndex: body.orderIndex !== undefined ? Number(body.orderIndex) : undefined,
        durationMinutes:
          body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
        videoUrl: body.videoUrl !== undefined ? (body.videoUrl ? body.videoUrl.trim() : null) : undefined,
        pdfUrl: body.pdfUrl !== undefined ? (body.pdfUrl ? body.pdfUrl.trim() : null) : undefined,
        notes: body.notes !== undefined ? (body.notes ? body.notes.trim() : null) : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'UPDATE_LEARNING_MODULE',
      module: 'LEARNING_HUB',
      details: `Updated learning module "${updated.title}" in course "${existing.course.title}". Status: ${updated.status}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Module updated successfully.',
      module: updated,
    });
  } catch (error: any) {
    console.error('Update module error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update module' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth.data;
    const { id } = await params;

    const existing = await prisma.module.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
    }

    await prisma.module.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'DELETE_LEARNING_MODULE',
      module: 'LEARNING_HUB',
      details: `Deleted module "${existing.title}" from course "${existing.course.title}".`,
    });

    return NextResponse.json({
      success: true,
      message: 'Learning module deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete module error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete module' },
      { status: 500 }
    );
  }
}

