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

    const { user, mentorProfile } = auth.data;
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        requirements: body.requirements !== undefined ? body.requirements.trim() : undefined,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        maxScore: body.maxScore !== undefined ? Number(body.maxScore) : undefined,
        passingScore: body.passingScore !== undefined ? Number(body.passingScore) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        instructionsUrl: body.instructionsUrl !== undefined ? (body.instructionsUrl ? body.instructionsUrl.trim() : null) : undefined,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'UPDATE_ASSIGNMENT_TASK',
      module: 'PROJECTS',
      details: `Updated task "${updated.title}". Status: ${updated.status}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully.',
      project: updated,
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
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

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'DELETE_ASSIGNMENT_TASK',
      module: 'PROJECTS',
      details: `Deleted project task "${existing.title}".`,
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}

