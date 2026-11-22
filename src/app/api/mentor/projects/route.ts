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

    // Fetch batches assigned to mentor
    const batches = await prisma.batch.findMany({
      where: { mentorId: mentorProfile.id },
      select: { id: true, name: true, domain: true },
    });
    const batchIds = batches.map((b) => b.id);

    // Fetch projects created by mentor OR associated with mentor's batches
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { mentorId: mentorProfile.id },
          { batchId: { in: batchIds } },
          { domain: mentorProfile.department || mentorProfile.expertise },
        ],
      },
      include: {
        batch: { select: { id: true, name: true } },
        submissions: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get mentor's assigned student profile IDs to filter submissions
    const assignedStudents = await prisma.studentProfile.findMany({
      where: { mentorId: mentorProfile.id },
      select: { id: true },
    });
    const assignedStudentIds = new Set(assignedStudents.map((s) => s.id));

    // Format deliverables with IDOR-scoped submissions
    const formatted = projects.map((p) => {
      // Submissions belonging to this mentor's assigned students
      const relevantSubmissions = p.submissions.filter((sub) =>
        assignedStudentIds.has(sub.studentId)
      );

      const pendingCount = relevantSubmissions.filter(
        (s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW' || s.status === 'RESUBMITTED'
      ).length;
      const approvedCount = relevantSubmissions.filter((s) => s.status === 'APPROVED').length;
      const revisionCount = relevantSubmissions.filter(
        (s) => s.status === 'REVISION_REQUIRED' || s.status === 'REVISION_REQUESTED'
      ).length;

      return {
        id: p.id,
        title: p.title,
        domain: p.domain,
        type: p.type || 'ASSIGNMENT',
        status: p.status || 'PUBLISHED',
        description: p.description,
        requirements: p.requirements,
        deadline: p.deadline,
        maxScore: p.maxScore,
        passingScore: p.passingScore || 60,
        batchName: p.batch?.name || 'All Batches in Domain',
        batchId: p.batchId,
        instructionsUrl: p.instructionsUrl,
        createdAt: p.createdAt,
        totalSubmissions: relevantSubmissions.length,
        pendingCount,
        approvedCount,
        revisionCount,
        submissions: relevantSubmissions.map((s) => ({
          id: s.id,
          studentId: s.studentId,
          studentName: s.student.user.name,
          studentEmail: s.student.user.email,
          repoUrl: s.repoUrl,
          liveUrl: s.liveUrl,
          fileUrl: s.fileUrl,
          notes: s.notes,
          status: s.status,
          score: s.score,
          mentorFeedback: s.mentorFeedback,
          submittedAt: s.submittedAt,
          gradedAt: s.gradedAt,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      batches,
      projects: formatted,
    });
  } catch (error: any) {
    console.error('Mentor projects fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
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
      type = 'ASSIGNMENT',
      domain,
      description,
      requirements,
      deadline,
      maxScore = 100,
      passingScore = 60,
      batchId,
      instructionsUrl,
      status = 'PUBLISHED',
    } = body;

    if (!title || !description || !requirements || !deadline) {
      return NextResponse.json(
        { error: 'Title, description, requirements, and deadline are required.' },
        { status: 400 }
      );
    }

    const targetDomain = domain || mentorProfile.department || mentorProfile.expertise || 'Software Engineering';

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        type,
        domain: targetDomain,
        description: description.trim(),
        requirements: requirements.trim(),
        deadline: new Date(deadline),
        maxScore: Number(maxScore) || 100,
        passingScore: Number(passingScore) || 60,
        batchId: batchId || null,
        mentorId: mentorProfile.id,
        instructionsUrl: instructionsUrl ? instructionsUrl.trim() : null,
        status,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'CREATE_ASSIGNMENT_TASK',
      module: 'PROJECTS',
      details: `Created ${type} "${project.title}" for domain ${targetDomain} (deadline: ${project.deadline.toISOString()}).`,
    });

    return NextResponse.json({
      success: true,
      message: `${type === 'ASSIGNMENT' ? 'Assignment' : 'Project'} created successfully.`,
      project,
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}

