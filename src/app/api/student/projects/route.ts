import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getAuthFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

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
        batch: {
          include: {
            mentor: { include: { user: true } },
          },
        },
        mentor: { include: { user: true } },
        submissions: {
          include: { project: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Projects for student's batch, domain, or mentor
    const projects = await prisma.project.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          student.batchId ? { batchId: student.batchId } : undefined,
          student.domain ? { domain: student.domain } : undefined,
          student.mentorId ? { mentorId: student.mentorId } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    const formatted = projects.map((p) => {
      const sub = p.submissions[0];
      return {
        id: p.id,
        title: p.title,
        domain: p.domain,
        type: p.type || 'ASSIGNMENT',
        description: p.description,
        requirements: p.requirements,
        deadline: p.deadline,
        maxScore: p.maxScore,
        passingScore: p.passingScore || 60,
        instructionsUrl: p.instructionsUrl,
        isOverdue: new Date() > new Date(p.deadline) && (!sub || sub.status !== 'APPROVED'),
        submission: sub
          ? {
              id: sub.id,
              repoUrl: sub.repoUrl,
              liveUrl: sub.liveUrl,
              fileUrl: sub.fileUrl,
              notes: sub.notes,
              status: sub.status,
              score: sub.score,
              mentorFeedback: sub.mentorFeedback,
              submittedAt: sub.submittedAt,
              gradedAt: sub.gradedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, projects: formatted });
  } catch (error) {
    console.error('Student projects fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user: any = await getAuthFromRequest(req);
    if (!user) user = await getSessionUser();

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        batch: { include: { mentor: { include: { user: true } } } },
        mentor: { include: { user: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { projectId, repoUrl, liveUrl, fileUrl, notes } = await req.json();

    if (!projectId || !repoUrl) {
      return NextResponse.json(
        { error: 'Project ID and repository URL are required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check existing submission
    const existingSubmission = await prisma.projectSubmission.findUnique({
      where: {
        projectId_studentId: {
          projectId,
          studentId: student.id,
        },
      },
    });

    const isResubmission =
      existingSubmission?.status === 'REVISION_REQUIRED' ||
      existingSubmission?.status === 'REVISION_REQUESTED';
    const nextStatus = isResubmission ? 'RESUBMITTED' : 'SUBMITTED';

    // Upsert submission
    const submission = await prisma.projectSubmission.upsert({
      where: {
        projectId_studentId: {
          projectId,
          studentId: student.id,
        },
      },
      update: {
        repoUrl: repoUrl.trim(),
        liveUrl: liveUrl ? liveUrl.trim() : null,
        fileUrl: fileUrl ? fileUrl.trim() : null,
        notes: notes ? notes.trim() : null,
        status: nextStatus,
        submittedAt: new Date(),
      },
      create: {
        projectId,
        studentId: student.id,
        repoUrl: repoUrl.trim(),
        liveUrl: liveUrl ? liveUrl.trim() : null,
        fileUrl: fileUrl ? fileUrl.trim() : null,
        notes: notes ? notes.trim() : null,
        status: nextStatus,
      },
    });

    // Notify mentor (assigned mentor or batch mentor)
    const mentorUser = student.mentor?.user || student.batch?.mentor?.user;
    if (mentorUser) {
      await dispatchNotification({
        userId: mentorUser.id,
        userEmail: mentorUser.email,
        userName: mentorUser.name,
        title: `${isResubmission ? 'Resubmitted' : 'New'} Deliverable: ${project.title}`,
        message: `${user.name} has ${isResubmission ? 'resubmitted their revised' : 'submitted their'} work for "${project.title}". Please review and evaluate.`,
        type: 'INFO',
        actionUrl: '/mentor/projects',
        channels: ['IN_APP', 'EMAIL'],
      });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'STUDENT',
      action: isResubmission ? 'PROJECT_RESUBMIT' : 'PROJECT_SUBMIT',
      module: 'PROJECTS',
      details: `${isResubmission ? 'Resubmitted' : 'Submitted'} work for ${project.title} (Repo: ${repoUrl})`,
    });

    return NextResponse.json({
      success: true,
      message: `Project ${isResubmission ? 'resubmitted' : 'submitted'} successfully for mentor review`,
      submission,
    });
  } catch (error) {
    console.error('Project submit error:', error);
    return NextResponse.json({ error: 'Failed to submit project' }, { status: 500 });
  }
}
