import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getAuthFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
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
        quizAttempts: { where: { quizId: id } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!quiz || quiz.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Quiz is not active.' }, { status: 404 });
    }

    if (student.quizAttempts.length >= (quiz.maxAttempts || 1)) {
      return NextResponse.json(
        { error: 'Maximum attempts reached for this quiz.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { answers = {} } = body; // Map of questionId -> studentAnswer (number or string)

    let totalScore = 0;
    let maxPossibleScore = 0;

    // Secure server-side grading
    for (const q of quiz.questions) {
      const qPoints = q.points || 1;
      maxPossibleScore += qPoints;

      const studentAns = answers[q.id];
      if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
        if (studentAns !== undefined && Number(studentAns) === q.correctIndex) {
          totalScore += qPoints;
        }
      } else if (q.type === 'DESCRIPTIVE') {
        // Auto-award 1 point if answered, pending mentor manual review
        if (studentAns && String(studentAns).trim().length > 10) {
          totalScore += 1;
        }
      }
    }

    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passed = percentage >= quiz.passScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        studentId: student.id,
        score: totalScore,
        maxScore: maxPossibleScore,
        passed,
        answers: JSON.stringify(answers),
        status: 'EVALUATED',
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'STUDENT',
      action: 'QUIZ_SUBMITTED',
      module: 'QUIZZES',
      details: `Submitted quiz "${quiz.title}". Score: ${totalScore}/${maxPossibleScore} (${percentage}%), Passed: ${passed}`,
    });

    return NextResponse.json({
      success: true,
      message: `Quiz submitted successfully. ${passed ? 'Congratulations, you passed!' : 'Review recommended.'}`,
      attempt: {
        id: attempt.id,
        score: totalScore,
        maxScore: maxPossibleScore,
        percentage,
        passed,
        submittedAt: attempt.submittedAt,
      },
    });
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}

