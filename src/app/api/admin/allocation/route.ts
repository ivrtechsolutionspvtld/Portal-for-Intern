import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getAuthFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { sendEmailNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    let admin: any = await getAuthFromRequest(req);
    if (!admin) {
      admin = await getSessionUser();
    }
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const [students, mentors, courses, batches, assignmentHistory] = await Promise.all([
      // 1. Students
      prisma.studentProfile.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, status: true, isDemo: true, avatar: true },
          },
          course: { select: { id: true, title: true, code: true, department: true } },
          mentor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          batch: { select: { id: true, name: true } },
        },
        orderBy: { enrollmentDate: 'desc' },
      }),
      // 2. Mentors with workload
      prisma.mentorProfile.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, status: true, isDemo: true, avatar: true } },
          _count: { select: { assignedStudents: true, batches: true } },
        },
        where: {
          user: { status: 'ACTIVE' },
        },
        orderBy: { user: { name: 'asc' } },
      }),
      // 3. Courses
      prisma.course.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, title: true, code: true, department: true, domain: true },
        orderBy: { title: 'asc' },
      }),
      // 4. Batches
      prisma.batch.findMany({
        include: {
          mentor: { include: { user: { select: { name: true, email: true } } } },
          _count: { select: { students: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // 5. Recent Assignment History
      prisma.mentorAssignmentHistory.findMany({
        include: {
          mentor: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
    ]);

    const mentorsWithWorkload = mentors.map((m) => {
      const assigned = m._count.assignedStudents;
      const capacity = m.maxStudents || 30;
      const percentage = Math.round((assigned / capacity) * 100);
      const isOverloaded = assigned >= capacity;
      return {
        ...m,
        workload: {
          assigned,
          capacity,
          percentage,
          isOverloaded,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        students,
        mentors: mentorsWithWorkload,
        courses,
        batches,
        assignmentHistory,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    console.error('Allocation fetch error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch allocations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let admin: any = await getAuthFromRequest(req);
    if (!admin) {
      admin = await getSessionUser();
    }
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentProfileId,
      studentProfileIds,
      newMentorId,
      newCourseId,
      newBatchId,
      reason,
      action = 'ASSIGN_STUDENT',
    } = body;

    // Support single or bulk assignment
    const targetIds: string[] = studentProfileIds && Array.isArray(studentProfileIds)
      ? studentProfileIds
      : studentProfileId
      ? [studentProfileId]
      : [];

    if (action === 'ASSIGN_BATCH') {
      // Assign mentor to a batch
      if (!newBatchId || !newMentorId) {
        return NextResponse.json({ error: 'Batch ID and Mentor ID are required.' }, { status: 400 });
      }
      const batch = await prisma.batch.update({
        where: { id: newBatchId },
        data: { mentorId: newMentorId === 'UNASSIGN' ? null : newMentorId },
        include: { mentor: { include: { user: true } } },
      });

      if (newMentorId !== 'UNASSIGN') {
        await prisma.mentorAssignmentHistory.create({
          data: {
            mentorId: newMentorId,
            batchId: newBatchId,
            assignmentType: 'BATCH',
            action: 'ASSIGNED',
            assignedBy: admin.email,
            reason: reason || 'Batch assigned to mentor',
          },
        });
      }

      await logAuditEvent({
        userId: admin.id,
        userEmail: admin.email,
        userRole: 'ADMIN',
        action: 'BATCH_MENTOR_ALLOCATION',
        module: 'MENTOR_ALLOCATION',
        details: `Batch ${batch.name} allocated to mentor ${batch.mentor?.user.name || 'Unassigned'}. Reason: ${reason || 'Admin action'}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Batch mentor allocation updated successfully.',
        batch,
      });
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one studentProfileId or studentProfileIds is required.' },
        { status: 400 }
      );
    }

    const results = [];

    for (const sId of targetIds) {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: sId },
        include: {
          user: true,
          mentor: { include: { user: true } },
          course: true,
          batch: true,
        },
      });

      if (!studentProfile) continue;

      const updateData: any = {};
      let mentorChangeDesc = '';
      let courseChangeDesc = '';
      let batchChangeDesc = '';

      // Handle Mentor Assignment / Unassignment
      if (newMentorId !== undefined) {
        if (newMentorId === 'UNASSIGN' || newMentorId === null || newMentorId === '') {
          updateData.mentorId = null;
          mentorChangeDesc = `Mentor unassigned from ${studentProfile.mentor?.user.name || 'None'}`;

          if (studentProfile.mentorId) {
            await prisma.mentorAssignmentHistory.create({
              data: {
                mentorId: studentProfile.mentorId,
                studentId: studentProfile.id,
                assignmentType: 'STUDENT',
                action: 'REMOVED',
                assignedBy: admin.email,
                reason: reason || 'Unassigned by Administrator',
              },
            });
          }
        } else {
          const newMentor = await prisma.mentorProfile.findUnique({
            where: { id: newMentorId },
            include: { user: true },
          });

          if (newMentor) {
            updateData.mentorId = newMentor.id;
            mentorChangeDesc = `Mentor assigned to ${newMentor.user.name} (${newMentor.designation})`;

            // Record assignment history
            await prisma.mentorAssignmentHistory.create({
              data: {
                mentorId: newMentor.id,
                studentId: studentProfile.id,
                assignmentType: 'STUDENT',
                action: studentProfile.mentorId ? 'REASSIGNED' : 'ASSIGNED',
                assignedBy: admin.email,
                reason: reason || 'Administrative mentor allocation',
              },
            });

            // Notify student in-app
            await prisma.notification.create({
              data: {
                userId: studentProfile.userId,
                title: 'Technical Mentor Assigned',
                message: `You have been assigned to faculty mentor ${newMentor.user.name} (${newMentor.designation}). You can connect with them through the Student Portal.`,
                type: 'INFO',
                link: '/student',
              },
            });

            // Transactional email
            await sendEmailNotification({
              to: studentProfile.user.email,
              subject: 'IVR Tech Solutions - Mentor Allocation Update',
              template: 'ACCOUNT_STATUS_CHANGE',
              variables: {
                name: studentProfile.user.name,
                status: 'ACTIVE',
                message: `Your technical faculty mentor is ${newMentor.user.name}. You can connect and submit deliverables through your student portal.`,
              },
            });
          }
        }
      }

      // Handle Course Assignment
      if (newCourseId) {
        const newCourse = await prisma.course.findUnique({ where: { id: newCourseId } });
        if (newCourse) {
          updateData.courseId = newCourse.id;
          updateData.domain = newCourse.domain;
          courseChangeDesc = `Course track set to ${newCourse.title}`;
        }
      }

      // Handle Batch Assignment
      if (newBatchId !== undefined) {
        updateData.batchId = newBatchId === 'UNASSIGN' ? null : newBatchId;
        batchChangeDesc = `Batch set to ${newBatchId || 'Unassigned'}`;
      }

      updateData.allocatedBy = admin.email;
      updateData.allocatedAt = new Date();

      const updated = await prisma.studentProfile.update({
        where: { id: sId },
        data: updateData,
        include: {
          course: true,
          mentor: { include: { user: true } },
          batch: true,
        },
      });

      // Record audit log
      const details = [mentorChangeDesc, courseChangeDesc, batchChangeDesc].filter(Boolean).join('. ');
      await logAuditEvent({
        userId: admin.id,
        userEmail: admin.email,
        userRole: 'ADMIN',
        action: 'ADMIN_REASSIGNED_ALLOCATION',
        module: 'MENTOR_ALLOCATION',
        details: `Updated allocation for ${studentProfile.user.name} (${studentProfile.studentId}): ${details}. Reason: ${reason || 'Administrative allocation'}`,
      });

      results.push(updated);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated allocation for ${results.length} student(s) with full audit logging.`,
      updatedStudents: results,
    });
  } catch (err: any) {
    console.error('Allocation update error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update allocation' }, { status: 500 });
  }
}
