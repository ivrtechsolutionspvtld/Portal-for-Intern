import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    let user: any = await getAuthFromRequest(req);
    if (!user) user = await getSessionUser();

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const { id } = await params;

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        quizAttempts: {
          where: { quizId: id },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { id: 'asc' },
          // STRICT SECURITY: DO NOT SELECT correctIndex, explanation, sampleAnswer!
          select: {
            id: true,
            question: true,
            type: true,
            options: true,
            points: true,
          },
        },
      },
    });

    if (!quiz || quiz.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Quiz not found or not currently active.' }, { status: 404 });
    }

    if (student.quizAttempts.length >= (quiz.maxAttempts || 1)) {
      return NextResponse.json(
        { error: `You have reached the maximum attempt limit (${quiz.maxAttempts}) for this quiz.` },
        { status: 403 }
      );
    }

    // Format questions safely
    const safeQuestions = quiz.questions.map((q) => {
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = ['True', 'False'];
      }

      return {
        id: q.id,
        question: q.question,
        type: q.type,
        options: parsedOptions,
        points: q.points || 1,
      };
    });

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        durationMinutes: quiz.durationMinutes,
        passScore: quiz.passScore,
        questions: safeQuestions,
      },
    });
  } catch (error: any) {
    console.error('Fetch student quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start quiz' },
      { status: 500 }
    );
  }
}

