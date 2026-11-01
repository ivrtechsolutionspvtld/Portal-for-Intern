import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const mentorId = params.id;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
        },
        assignedStudents: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            batch: true,
          },
        },
        batches: true,
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    return NextResponse.json({ mentor });
  } catch (error) {
    console.error('Get mentor error:', error);
    return NextResponse.json({ error: 'Failed to fetch mentor details' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const mentorId = params.id;
    const data = await req.json();

    const existingMentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: true },
    });

    if (!existingMentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update User fields
      if (data.name !== undefined || data.status !== undefined || data.phone !== undefined) {
        await tx.user.update({
          where: { id: existingMentor.userId },
          data: {
            name: data.name !== undefined ? data.name : existingMentor.user.name,
            status: data.status !== undefined ? data.status : existingMentor.user.status,
            phone: data.phone !== undefined ? data.phone : existingMentor.user.phone,
          },
        });
      }

      // Update MentorProfile fields
      return await tx.mentorProfile.update({
        where: { id: mentorId },
        data: {
          designation: data.designation !== undefined ? data.designation : existingMentor.designation,
          department: data.department !== undefined ? data.department : existingMentor.department,
          expertise: data.expertise !== undefined ? data.expertise : existingMentor.expertise,
          bio: data.bio !== undefined ? data.bio : existingMentor.bio,
          maxStudents: data.maxStudents !== undefined ? parseInt(data.maxStudents, 10) : existingMentor.maxStudents,
        },
        include: {
          user: true,
          assignedStudents: true,
          batches: true,
        },
      });
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'MENTOR_UPDATE',
      module: 'MENTOR_MANAGEMENT',
      details: `Updated mentor profile ${existingMentor.user.email} (Status: ${data.status || existingMentor.user.status})`,
    });

    return NextResponse.json({ success: true, mentor: updated });
  } catch (error) {
    console.error('Update mentor error:', error);
    return NextResponse.json({ error: 'Failed to update mentor profile' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const mentorId = params.id;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: true, assignedStudents: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Safely unassign any students and batches first
    await prisma.$transaction(async (tx) => {
      await tx.studentProfile.updateMany({
        where: { mentorId },
        data: { mentorId: null },
      });

      await tx.batch.updateMany({
        where: { mentorId },
        data: { mentorId: null },
      });

      // Delete mentor user record (cascades to mentorProfile)
      await tx.user.delete({
        where: { id: mentor.userId },
      });
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'MENTOR_DELETE',
      module: 'MENTOR_MANAGEMENT',
      details: `Deleted mentor ${mentor.user.email} (${mentor.user.name})`,
    });

    return NextResponse.json({ success: true, message: 'Mentor removed successfully' });
  } catch (error) {
    console.error('Delete mentor error:', error);
    return NextResponse.json({ error: 'Failed to delete mentor' }, { status: 500 });
  }
}
