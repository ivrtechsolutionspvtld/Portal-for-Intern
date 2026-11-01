import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      include: {
        batch: { select: { id: true, name: true, domain: true } },
        submissions: {
          include: {
            student: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    const formatted = projects.map((p) => {
      const submitted = p.submissions.filter((s) => s.status === 'SUBMITTED').length;
      const approved = p.submissions.filter((s) => s.status === 'APPROVED').length;
      const revision = p.submissions.filter((s) => s.status === 'REVISION_REQUESTED').length;

      return {
        id: p.id,
        title: p.title,
        domain: p.domain,
        description: p.description,
        requirements: p.requirements,
        deadline: p.deadline,
        maxScore: p.maxScore,
        batch: p.batch,
        totalSubmissions: p.submissions.length,
        pendingReviewCount: submitted,
        approvedCount: approved,
        revisionCount: revision,
        submissions: p.submissions.map((s) => ({
          id: s.id,
          studentName: s.student.user.name,
          studentEmail: s.student.user.email,
          repoUrl: s.repoUrl,
          liveUrl: s.liveUrl,
          status: s.status,
          score: s.score,
          mentorFeedback: s.mentorFeedback,
          submittedAt: s.submittedAt,
        })),
      };
    });

    return NextResponse.json({ projects: formatted });
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { title, domain, description, requirements, deadline, maxScore, batchId } = await req.json();

    if (!title || !domain || !description || !deadline) {
      return NextResponse.json({ error: 'Title, domain, description, and deadline are required' }, { status: 400 });
    }

    const newProject = await prisma.project.create({
      data: {
        title: title.trim(),
        domain,
        description: description.trim(),
        requirements: requirements || '',
        deadline: new Date(deadline),
        maxScore: maxScore ? parseInt(maxScore, 10) : 100,
        batchId: batchId || null,
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'PROJECT_CREATE',
      module: 'PROJECTS',
      details: `Created project milestone "${title}" for domain ${domain}`,
    });

    return NextResponse.json({ success: true, project: newProject });
  } catch (error) {
    console.error('Project create error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
