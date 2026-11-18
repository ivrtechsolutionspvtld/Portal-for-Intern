import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const program = await prisma.internshipProgram.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Internship program not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, program },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Program fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch internship program' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title,
      description,
      domain,
      courseId,
      duration,
      level,
      techStack,
      projects,
      stipend,
      mode,
      status,
    } = body;

    const existingProgram = await prisma.internshipProgram.findUnique({ where: { id } });
    if (!existingProgram) {
      return NextResponse.json({ error: 'Internship program not found' }, { status: 404 });
    }

    const updated = await prisma.internshipProgram.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(domain !== undefined && { domain: domain.trim() }),
        ...(courseId !== undefined && { courseId: courseId || null }),
        ...(duration !== undefined && { duration: duration.trim() }),
        ...(level !== undefined && { level }),
        ...(techStack !== undefined && { techStack: techStack ? techStack.trim() : null }),
        ...(projects !== undefined && { projects: projects ? projects.trim() : null }),
        ...(stipend !== undefined && { stipend: stipend.trim() }),
        ...(mode !== undefined && { mode: mode.trim() }),
        ...(status !== undefined && { status }),
      },
      include: {
        course: true,
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'PROGRAM_UPDATED',
      module: 'INTERNSHIP_PROGRAMS',
      details: `Updated internship program: ${updated.title} (Status: ${updated.status}, Domain: ${updated.domain})`,
    });

    return NextResponse.json(
      { success: true, program: updated },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Program update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update internship program' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const program = await prisma.internshipProgram.findUnique({ where: { id } });
    if (!program) {
      return NextResponse.json({ error: 'Internship program not found' }, { status: 404 });
    }

    await prisma.internshipProgram.delete({ where: { id } });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'PROGRAM_DELETED',
      module: 'INTERNSHIP_PROGRAMS',
      details: `Deleted internship program: ${program.title} (Domain: ${program.domain})`,
    });

    return NextResponse.json(
      { success: true, message: 'Internship program deleted successfully' },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Program delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete internship program' }, { status: 500 });
  }
}

