import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await props.params;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        assignedStudents: {
          include: {
            user: true,
            batch: true,
          },
        },
        batches: true,
        attendanceSessions: {
          take: 10,
          orderBy: { sessionDate: 'desc' },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found in system records.' }, { status: 404 });
    }

    return NextResponse.json({ mentor });
  } catch (err: any) {
    console.error('Mentor fetch detail error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch mentor details.' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await req.json();

    const existingMentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingMentor) {
      return NextResponse.json({ error: 'Mentor not found in system records.' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update user fields
      if (body.name || body.status || body.phone || body.avatar) {
        await tx.user.update({
          where: { id: existingMentor.userId },
          data: {
            name: body.name !== undefined ? body.name.trim() : existingMentor.user.name,
            phone: body.phone !== undefined ? body.phone?.trim() : existingMentor.user.phone,
            status: body.status !== undefined ? body.status : existingMentor.user.status,
            avatar: body.avatar !== undefined ? body.avatar : existingMentor.user.avatar,
          },
        });
      }

      // 2. Update profile fields
      const profile = await tx.mentorProfile.update({
        where: { id },
        data: {
          mentorId: body.mentorId !== undefined ? body.mentorId : existingMentor.mentorId,
          employeeId: body.employeeId !== undefined ? body.employeeId : existingMentor.employeeId,
          designation: body.designation !== undefined ? body.designation : existingMentor.designation,
          department: body.department !== undefined ? body.department : existingMentor.department,
          expertise: body.expertise !== undefined ? body.expertise : existingMentor.expertise,
          experience: body.experience !== undefined ? body.experience : existingMentor.experience,
          assignedProgram: body.assignedProgram !== undefined ? body.assignedProgram : existingMentor.assignedProgram,
          bio: body.bio !== undefined ? body.bio : existingMentor.bio,
          maxStudents: body.maxStudents !== undefined ? parseInt(body.maxStudents, 10) : existingMentor.maxStudents,
        },
        include: {
          user: true,
          assignedStudents: { include: { user: true } },
          batches: true,
        },
      });

      // 3. Assign or reassign specific students if provided
      if (Array.isArray(body.assignStudentIds)) {
        await tx.studentProfile.updateMany({
          where: { id: { in: body.assignStudentIds } },
          data: { mentorId: id },
        });
      }

      // 4. Unassign specific students if requested
      if (Array.isArray(body.unassignStudentIds)) {
        await tx.studentProfile.updateMany({
          where: { id: { in: body.unassignStudentIds }, mentorId: id },
          data: { mentorId: null },
        });
      }

      return profile;
    });

    await logAuditEvent({
      userId: admin.id,
      userEmail: admin.email,
      userRole: 'ADMIN',
      action: 'MENTOR_UPDATE',
      module: 'MENTOR_MANAGEMENT',
      details: `Updated mentor ${existingMentor.user.name} (${existingMentor.user.email}). Status: ${body.status || existingMentor.user.status}`,
    });

    return NextResponse.json({ success: true, mentor: updated });
  } catch (err: any) {
    console.error('Mentor update error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update mentor details.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await props.params;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found in system records.' }, { status: 404 });
    }

    // 1. Unlink assigned students so they don't break
    await prisma.studentProfile.updateMany({
      where: { mentorId: id },
      data: { mentorId: null },
    });

    // 2. Unlink batches
    await prisma.batch.updateMany({
      where: { mentorId: id },
      data: { mentorId: null },
    });

    // 3. Delete user account (cascade deletes mentor profile)
    await prisma.user.delete({
      where: { id: mentor.userId },
    });

    await logAuditEvent({
      userId: admin.id,
      userEmail: admin.email,
      userRole: 'ADMIN',
      action: 'MENTOR_DELETE',
      module: 'MENTOR_MANAGEMENT',
      details: `Deleted mentor profile and account for ${mentor.user.name} (${mentor.user.email})`,
    });

    return NextResponse.json({ success: true, message: `Mentor ${mentor.user.name} removed successfully.` });
  } catch (err: any) {
    console.error('Mentor deletion error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete mentor.' }, { status: 500 });
  }
}
