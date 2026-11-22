import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    let user: any = await getAuthFromRequest(req);
    if (!user) user = await getSessionUser();

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        batch: true,
        quizAttempts: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Published quizzes for student's batch, domain, or mentor
    const quizzes = await prisma.quiz.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          student.batchId ? { batchId: student.batchId } : undefined,
          student.mentorId ? { mentorId: student.mentorId } : undefined,
          student.courseId ? { courseId: student.courseId } : undefined,
          // Fallback: any published quiz if unassigned
          { id: { not: '' } },
        ].filter(Boolean) as any,
      },
      include: {
        questions: { select: { id: true, points: true } },
        attempts: {
          where: { studentId: student.id },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = quizzes.map((q) => {
      const myAttempts = q.attempts;
      const latestAttempt = myAttempts[0] || null;
      const totalPoints = q.questions.reduce((sum, qn) => sum + (qn.points || 1), 0);
      const canAttempt = myAttempts.length < (q.maxAttempts || 1);

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        durationMinutes: q.durationMinutes,
        passScore: q.passScore,
        maxAttempts: q.maxAttempts || 1,
        questionCount: q.questions.length,
        totalPoints,
        attemptsCount: myAttempts.length,
        canAttempt,
        latestAttempt: latestAttempt
          ? {
              score: latestAttempt.score,
              maxScore: latestAttempt.maxScore,
              percentage: latestAttempt.maxScore > 0 ? Math.round((latestAttempt.score / latestAttempt.maxScore) * 100) : 0,
              passed: latestAttempt.passed,
              submittedAt: latestAttempt.submittedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, quizzes: formatted });
  } catch (error: any) {
    console.error('Student quizzes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

