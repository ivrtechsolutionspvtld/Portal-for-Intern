import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { mentorProfile } = auth.data;

    const quizzes = await prisma.quiz.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        questions: true,
        attempts: {
          include: {
            student: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = quizzes.map((q) => {
      const totalAttempts = q.attempts.length;
      const passedCount = q.attempts.filter((a) => a.passed).length;
      const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        durationMinutes: q.durationMinutes,
        passScore: q.passScore,
        maxAttempts: q.maxAttempts || 1,
        status: q.status,
        questionCount: q.questions.length,
        totalPoints: q.questions.reduce((sum, qn) => sum + (qn.points || 1), 0),
        attemptsCount: totalAttempts,
        passRate,
        createdAt: q.createdAt,
        questions: q.questions,
        attempts: q.attempts.map((a) => ({
          id: a.id,
          studentName: a.student.user.name,
          studentEmail: a.student.user.email,
          score: a.score,
          maxScore: a.maxScore,
          percentage: a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0,
          passed: a.passed,
          submittedAt: a.submittedAt,
        })),
      };
    });

    return NextResponse.json({ success: true, quizzes: formatted });
  } catch (error: any) {
    console.error('Mentor quizzes fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user, mentorProfile } = auth.data;
    const body = await req.json();
    const {
      title,
      description,
      durationMinutes = 30,
      passScore = 60,
      maxAttempts = 1,
      batchId,
      courseId,
      status = 'PUBLISHED',
      questions = [],
    } = body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Quiz title and at least one question are required.' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        mentorId: mentorProfile.id,
        durationMinutes: Number(durationMinutes) || 30,
        passScore: Number(passScore) || 60,
        maxAttempts: Number(maxAttempts) || 1,
        batchId: batchId || null,
        courseId: courseId || null,
        status,
        questions: {
          create: questions.map((q: any) => ({
            question: q.question.trim(),
            type: q.type || 'MCQ',
            options: JSON.stringify(q.options || ['True', 'False']),
            correctIndex: Number(q.correctIndex ?? 0),
            explanation: q.explanation ? q.explanation.trim() : null,
            sampleAnswer: q.sampleAnswer ? q.sampleAnswer.trim() : null,
            points: Number(q.points) || 1,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'CREATE_QUIZ_ASSESSMENT',
      module: 'QUIZZES',
      details: `Created quiz "${quiz.title}" with ${quiz.questions.length} questions. Status: ${status}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz created successfully.',
      quiz,
    });
  } catch (error: any) {
    console.error('Create quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

