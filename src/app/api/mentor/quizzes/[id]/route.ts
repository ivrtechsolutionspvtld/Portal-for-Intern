import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { mentorProfile } = auth.data;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
        attempts: {
          include: {
            student: { include: { user: { select: { name: true, email: true } } } },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    if (quiz.mentorId !== mentorProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this quiz.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    console.error('Fetch quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { mentorProfile, user } = auth.data;
    const body = await req.json();

    const existing = await prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    if (existing.mentorId !== mentorProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this quiz.' },
        { status: 403 }
      );
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        durationMinutes:
          body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
        passScore: body.passScore !== undefined ? Number(body.passScore) : undefined,
        maxAttempts: body.maxAttempts !== undefined ? Number(body.maxAttempts) : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'UPDATE_QUIZ',
      module: 'QUIZZES',
      details: `Updated quiz "${updated.title}". Status: ${updated.status}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz updated successfully.',
      quiz: updated,
    });
  } catch (error: any) {
    console.error('Update quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quiz' },
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

    const { id } = await params;
    const { mentorProfile, user } = auth.data;

    const existing = await prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    if (existing.mentorId !== mentorProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this quiz.' },
        { status: 403 }
      );
    }

    await prisma.quiz.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'DELETE_QUIZ',
      module: 'QUIZZES',
      details: `Deleted quiz "${existing.title}".`,
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}

