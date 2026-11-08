import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const studentProfileId = params.id;
    const data = await req.json();

    const existingStudent = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { user: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update User fields if provided
      if (data.name || data.status || data.phone) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            name: data.name !== undefined ? data.name : existingStudent.user.name,
            status: data.status !== undefined ? data.status : existingStudent.user.status,
            phone: data.phone !== undefined ? data.phone : existingStudent.user.phone,
          },
        });
      }

      // Update StudentProfile fields
      return await tx.studentProfile.update({
        where: { id: studentProfileId },
        data: {
          studentId: data.studentId !== undefined ? data.studentId : existingStudent.studentId,
          college: data.college !== undefined ? data.college : existingStudent.college,
          department: data.department !== undefined ? data.department : existingStudent.department,
          degree: data.degree !== undefined ? data.degree : existingStudent.degree,
          academicYear: data.academicYear !== undefined ? data.academicYear : existingStudent.academicYear,
          graduationYear: data.graduationYear !== undefined ? parseInt(data.graduationYear, 10) : existingStudent.graduationYear,
          regNumber: data.regNumber !== undefined ? data.regNumber : existingStudent.regNumber,
          dob: data.dob !== undefined ? (data.dob ? new Date(data.dob) : null) : existingStudent.dob,
          address: data.address !== undefined ? data.address : existingStudent.address,
          domain: data.domain !== undefined ? data.domain : existingStudent.domain,
          startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : existingStudent.startDate,
          endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existingStudent.endDate,
          batchId: data.batchId !== undefined ? data.batchId || null : existingStudent.batchId,
          mentorId: data.mentorId !== undefined ? data.mentorId || null : existingStudent.mentorId,
          resumeUrl: data.resumeUrl !== undefined ? data.resumeUrl : existingStudent.resumeUrl,
          bio: data.bio !== undefined ? data.bio : existingStudent.bio,
          cgpa: data.cgpa !== undefined ? parseFloat(data.cgpa) : existingStudent.cgpa,
        },
        include: {
          user: true,
          batch: true,
          mentor: { include: { user: true } },
        },
      });
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'STUDENT_UPDATE',
      module: 'STUDENT_MANAGEMENT',
      details: `Updated student ${existingStudent.user.email} (Status: ${data.status || existingStudent.user.status}, Batch: ${data.batchId})`,
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ error: 'Failed to update student profile' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const studentProfileId = params.id;

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Cascade delete via user
    await prisma.user.delete({
      where: { id: student.userId },
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'STUDENT_DELETE',
      module: 'STUDENT_MANAGEMENT',
      details: `Deleted student profile ${studentProfileId}`,
    });

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const student = await prisma.studentProfile.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        batch: true,
        mentor: { include: { user: true } },
        attendanceRecords: true,
        submissions: { include: { project: true } },
        certificate: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 });
  }
}

