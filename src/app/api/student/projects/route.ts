import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const user = await getSessionUser();
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
        submissions: {
          include: { project: true },
        },
      },
    });

    if (!student || !student.batchId) {
      return NextResponse.json({ projects: [] });
    }

    // Projects for student's batch
    const projects = await prisma.project.findMany({
      where: { batchId: student.batchId },
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
        description: p.description,
        requirements: p.requirements,
        deadline: p.deadline,
        maxScore: p.maxScore,
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

    return NextResponse.json({ projects: formatted });
  } catch (error) {
    console.error('Student projects fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        batch: { include: { mentor: { include: { user: true } } } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { projectId, repoUrl, liveUrl, fileUrl, notes } = await req.json();

    if (!projectId || !repoUrl) {
      return NextResponse.json({ error: 'Project ID and repository URL are required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        projectId,
        studentId: student.id,
        repoUrl: repoUrl.trim(),
        liveUrl: liveUrl ? liveUrl.trim() : null,
        fileUrl: fileUrl ? fileUrl.trim() : null,
        notes: notes ? notes.trim() : null,
        status: 'SUBMITTED',
      },
    });

    // Notify mentor
    if (student.batch?.mentor?.user) {
      await dispatchNotification({
        userId: student.batch.mentor.user.id,
        userEmail: student.batch.mentor.user.email,
        userName: student.batch.mentor.user.name,
        title: `Project Submission: ${project.title}`,
        message: `${user.name} submitted their work for ${project.title}. Please review and evaluate.`,
        type: 'INFO',
        actionUrl: '/mentor/projects',
        channels: ['IN_APP', 'EMAIL'],
      });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'STUDENT',
      action: 'PROJECT_SUBMIT',
      module: 'PROJECTS',
      details: `Submitted work for ${project.title} (Repo: ${repoUrl})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Project submitted successfully for mentor review',
      submission,
    });
  } catch (error) {
    console.error('Project submit error:', error);
    return NextResponse.json({ error: 'Failed to submit project' }, { status: 500 });
  }
}
