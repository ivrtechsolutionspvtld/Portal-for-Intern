import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { sendEmailNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true, isDemo: true } },
        course: { select: { id: true, title: true, code: true, department: true } },
        mentor: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        batch: { select: { id: true, name: true } },
      },
      orderBy: { enrollmentDate: 'desc' },
    });

    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, status: true, isDemo: true } },
        _count: { select: { assignedStudents: true } },
      },
      where: {
        user: { status: 'ACTIVE' },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const courses = await prisma.course.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, title: true, code: true, department: true },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({
      success: true,
      students,
      mentors,
      courses,
    });
  } catch (err: any) {
    console.error('Allocation fetch error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch allocations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { studentProfileId, newMentorId, newCourseId, reason } = await req.json();

    if (!studentProfileId) {
      return NextResponse.json({ error: 'Student Profile ID is required.' }, { status: 400 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        user: true,
        mentor: { include: { user: true } },
        course: true,
      },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const updateData: any = {};
    let mentorChangeDesc = '';
    let courseChangeDesc = '';

    if (newMentorId) {
      const newMentor = await prisma.mentorProfile.findUnique({
        where: { id: newMentorId },
        include: { user: true },
      });
      if (!newMentor) {
        return NextResponse.json({ error: 'Target mentor not found.' }, { status: 404 });
      }
      updateData.mentorId = newMentor.id;
      mentorChangeDesc = `Mentor changed from ${studentProfile.mentor?.user.name || 'Unassigned'} to ${newMentor.user.name}`;

      // Notify student
      await prisma.notification.create({
        data: {
          userId: studentProfile.userId,
          title: 'Faculty Mentor Reassigned',
          message: `Your technical mentor has been updated to ${newMentor.user.name} (${newMentor.designation}, ${newMentor.department}). Reason: ${reason || 'Administrative re-allocation'}.`,
          type: 'INFO',
          link: '/student',
        },
      });

      // Send transactional email
      await sendEmailNotification({
        to: studentProfile.user.email,
        subject: 'IVR Tech Solutions - Mentor Assignment Update',
        template: 'ACCOUNT_STATUS_CHANGE',
        variables: {
          name: studentProfile.user.name,
          status: 'ACTIVE',
          message: `Your faculty mentor has been updated to ${newMentor.user.name}. You can connect with your mentor through the student portal.`,
        },
      });
    }

    if (newCourseId) {
      const newCourse = await prisma.course.findUnique({ where: { id: newCourseId } });
      if (!newCourse) {
        return NextResponse.json({ error: 'Target course not found.' }, { status: 404 });
      }
      updateData.courseId = newCourse.id;
      updateData.domain = newCourse.domain;
      courseChangeDesc = `Course track changed from ${studentProfile.course?.title || studentProfile.domain} to ${newCourse.title}`;
    }

    updateData.allocatedBy = admin.email;
    updateData.allocatedAt = new Date();

    const updated = await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: updateData,
      include: {
        course: true,
        mentor: { include: { user: true } },
      },
    });

    // Record audit log
    await logAuditEvent({
      userId: admin.id,
      userEmail: admin.email,
      userRole: 'ADMIN',
      action: 'ADMIN_REASSIGNED_ALLOCATION',
      module: 'MENTOR_ALLOCATION',
      details: `Reassigned for ${studentProfile.user.name} (${studentProfile.studentId}): ${[mentorChangeDesc, courseChangeDesc].filter(Boolean).join('. ')}. Remarks: ${reason || 'Administrative adjustment'}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Allocation updated successfully with audit trail.',
      student: updated,
    });
  } catch (err: any) {
    console.error('Allocation update error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update allocation' }, { status: 500 });
  }
}

