import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const batches = await prisma.batch.findMany({
      include: {
        mentor: {
          include: { user: { select: { name: true, email: true } } },
        },
        students: {
          select: { id: true },
        },
        sessions: {
          select: { id: true },
        },
        projects: {
          select: { id: true, title: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const formatted = batches.map((b) => ({
      id: b.id,
      name: b.name,
      domain: b.domain,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      mentor: b.mentor ? { id: b.mentor.id, name: b.mentor.user.name, email: b.mentor.user.email } : null,
      studentCount: b.students.length,
      sessionCount: b.sessions.length,
      projectCount: b.projects.length,
    }));

    return NextResponse.json({ batches: formatted });
  } catch (error) {
    console.error('Batches fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, domain, startDate, endDate, mentorId, status } = await req.json();

    if (!name || !domain || !startDate || !endDate) {
      return NextResponse.json({ error: 'Name, domain, start date, and end date are required' }, { status: 400 });
    }

    const newBatch = await prisma.batch.create({
      data: {
        name: name.trim(),
        domain,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        mentorId: mentorId || null,
        status: status || 'ACTIVE',
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'BATCH_CREATE',
      module: 'BATCH_MANAGEMENT',
      details: `Created batch ${name} (${domain})`,
    });

    return NextResponse.json({ success: true, batch: newBatch });
  } catch (error) {
    console.error('Batch create error:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, name, domain, startDate, endDate, mentorId, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    const updated = await prisma.batch.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        domain: domain || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        mentorId: mentorId !== undefined ? mentorId || null : undefined,
        status: status || undefined,
      },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'BATCH_UPDATE',
      module: 'BATCH_MANAGEMENT',
      details: `Updated batch ${updated.name}`,
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error) {
    console.error('Batch update error:', error);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}
