import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor } from '@/lib/mentor-auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { user, mentorProfile } = auth.data;
    const { submissionId, score, status, mentorFeedback } = await req.json();

    if (!submissionId || !status || score === undefined) {
      return NextResponse.json(
        { error: 'Submission ID, status, and score are required' },
        { status: 400 }
      );
    }

    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      include: {
        project: true,
        student: { include: { user: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Project submission not found' }, { status: 404 });
    }

    // Strict IDOR verification: Check if submission belongs to an assigned student
    if (submission.student.mentorId !== mentorProfile.id) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        userRole: 'MENTOR',
        action: 'SECURITY_VIOLATION_UNAUTHORIZED_GRADING',
        module: 'SUBMISSIONS_EVALUATION',
        details: `Mentor ${user.email} attempted to grade submission ${submissionId} belonging to unassigned student ${submission.student.user.name}.`,
      });

      return NextResponse.json(
        {
          error:
            'Forbidden: You are not authorized to evaluate this submission. This student is assigned to another mentor.',
        },
        { status: 403 }
      );
    }

    const updated = await prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        score: parseInt(score, 10),
        status,
        mentorFeedback: mentorFeedback || null,
        gradedAt: new Date(),
      },
    });

    // Notify student
    await dispatchNotification({
      userId: submission.student.userId,
      userEmail: submission.student.user.email,
      userName: submission.student.user.name,
      title: `Project Evaluation: ${submission.project.title}`,
      message: `Your mentor ${user.name} has evaluated your project submission.<br><br><strong>Status:</strong> ${status}<br><strong>Score:</strong> ${score}/100<br><strong>Feedback:</strong> ${mentorFeedback || 'Approved by mentor.'}`,
      type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      actionUrl: '/student/projects',
      channels: ['IN_APP', 'EMAIL'],
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'PROJECT_EVALUATION',
      module: 'PROJECTS',
      details: `Evaluated submission for assigned student ${submission.student.user.name} on ${submission.project.title}: Score ${score}, Status: ${status}`,
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error: any) {
    console.error('Grade submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grade project submission' },
      { status: 500 }
    );
  }
}
