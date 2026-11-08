import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification, sendEmailNotification } from '@/lib/notifications';

// GET all approval requests categorized by status
export async function GET(req: Request) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Administrator privileges required.' }, { status: 403 });
    }

    // 1. Pending Students
    const pendingStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'PENDING_APPROVAL',
      },
      include: {
        studentProfile: {
          include: {
            batch: true,
            mentor: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Pending Mentors
    const pendingMentors = await prisma.user.findMany({
      where: {
        role: 'MENTOR',
        status: 'PENDING_APPROVAL',
      },
      include: {
        mentorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Approved Accounts (Active Students & Mentors)
    const approvedAccounts = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'MENTOR'] },
        status: 'ACTIVE',
      },
      include: {
        studentProfile: {
          include: {
            batch: true,
            mentor: { include: { user: true } },
          },
        },
        mentorProfile: true,
      },
      orderBy: { approvedAt: 'desc' },
      take: 100,
    });

    // 4. Rejected Accounts
    const rejectedAccounts = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'MENTOR'] },
        status: 'REJECTED',
      },
      include: {
        studentProfile: true,
        mentorProfile: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 5. Deactivated Accounts
    const deactivatedAccounts = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'MENTOR'] },
        status: { in: ['DEACTIVATED', 'SUSPENDED', 'INACTIVE'] },
      },
      include: {
        studentProfile: true,
        mentorProfile: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 6. Info Requested Accounts
    const infoRequestedAccounts = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'MENTOR'] },
        status: 'INFO_REQUESTED',
      },
      include: {
        studentProfile: true,
        mentorProfile: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      counts: {
        pendingStudents: pendingStudents.length,
        pendingMentors: pendingMentors.length,
        approvedAccounts: approvedAccounts.length,
        rejectedAccounts: rejectedAccounts.length,
        deactivatedAccounts: deactivatedAccounts.length,
        infoRequested: infoRequestedAccounts.length,
      },
      pendingStudents,
      pendingMentors,
      approvedAccounts,
      rejectedAccounts,
      deactivatedAccounts,
      infoRequestedAccounts,
    });
  } catch (err: any) {
    console.error('Approvals fetch error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch approval queue.' }, { status: 500 });
  }
}

// POST: Execute approval workflow action
export async function POST(req: Request) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Administrator privileges required.' }, { status: 403 });
    }

    const {
      userId,
      action,
      notes,
      courseId,
      mentorId,
      startDate,
      endDate,
      duration,
      batchId,
    } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and workflow action are required.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            course: true,
            mentor: { include: { user: true } },
          },
        },
        mentorProfile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in system records.' }, { status: 404 });
    }

    // Students/Mentors cannot approve themselves
    if (admin.id === targetUser.id) {
      return NextResponse.json({ error: 'Security violation: Administrators cannot self-approve or alter their own status via this endpoint.' }, { status: 400 });
    }

    let updatedStatus = targetUser.status;
    let auditAction = '';
    let notificationTitle = '';
    let notificationBody = '';

    switch (action) {
      case 'APPROVE': {
        // Enforce mandatory course and mentor allocation for Students
        if (targetUser.role === 'STUDENT') {
          if (!courseId) {
            return NextResponse.json(
              { error: 'Mandatory Allocation Missing: You must select an internship course before approving and activating this student.' },
              { status: 400 }
            );
          }
          if (!mentorId) {
            return NextResponse.json(
              { error: 'Mandatory Allocation Missing: You must assign an available mentor before approving and activating this student.' },
              { status: 400 }
            );
          }

          const selectedCourse = await prisma.course.findUnique({ where: { id: courseId } });
          if (!selectedCourse) {
            return NextResponse.json({ error: 'Selected internship course not found.' }, { status: 404 });
          }

          const selectedMentor = await prisma.mentorProfile.findUnique({
            where: { id: mentorId },
            include: { user: true },
          });
          if (!selectedMentor) {
            return NextResponse.json({ error: 'Selected faculty mentor not found.' }, { status: 404 });
          }

          const sDate = startDate ? new Date(startDate) : new Date();
          const eDate = endDate ? new Date(endDate) : new Date(Date.now() + (selectedCourse.durationWeeks * 7 * 24 * 60 * 60 * 1000));
          const dur = duration?.trim() || `${selectedCourse.durationWeeks} Weeks`;

          await prisma.studentProfile.update({
            where: { userId: targetUser.id },
            data: {
              courseId: selectedCourse.id,
              domain: selectedCourse.domain,
              mentorId: selectedMentor.id,
              startDate: sDate,
              endDate: eDate,
              duration: dur,
              batchId: batchId || null,
              allocatedBy: admin.email,
              allocatedAt: new Date(),
            },
          });

          notificationTitle = 'Account Approved & Course Allocated';
          notificationBody = `Welcome to IVR TECH SOLUTIONS PRIVATE LIMITED! Your internship account has been activated. Track: ${selectedCourse.title} (${dur}). Assigned Mentor: ${selectedMentor.user.name}. You may now log in.`;
        } else {
          notificationTitle = 'Mentor Account Approved & Activated';
          notificationBody = `Welcome to IVR TECH SOLUTIONS PRIVATE LIMITED! Your mentor profile has been verified and activated. You may now log in to access your assigned student cohorts.`;
        }

        updatedStatus = 'ACTIVE';
        auditAction = targetUser.role === 'STUDENT' ? 'STUDENT_APPROVED_AND_ALLOCATED' : 'MENTOR_APPROVED';

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'ACTIVE',
            approvedAt: new Date(),
            approvedBy: admin.email,
            approvalNotes: notes?.trim() || 'Approved and provisioned by enterprise administrator',
          },
        });
        break;
      }

      case 'REJECT': {
        updatedStatus = 'REJECTED';
        auditAction = 'ACCOUNT_REJECTED';
        notificationTitle = 'Registration Status Update';
        notificationBody = `Your application registration could not be approved. Reason: ${notes || 'Does not satisfy enrollment criteria'}.`;

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'REJECTED',
            approvalNotes: notes?.trim() || 'Registration application declined by administrator',
          },
        });
        break;
      }

      case 'REQUEST_INFO': {
        updatedStatus = 'INFO_REQUESTED';
        auditAction = 'INFO_REQUESTED';
        notificationTitle = 'Additional Information Required';
        notificationBody = `Please provide additional details regarding your application: ${notes || 'Verification document clarification required'}.`;

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'INFO_REQUESTED',
            approvalNotes: notes?.trim() || 'Additional information requested by administrator',
          },
        });
        break;
      }

      case 'DEACTIVATE': {
        updatedStatus = 'DEACTIVATED';
        auditAction = 'ACCOUNT_DEACTIVATED';
        notificationTitle = 'Account Deactivated';
        notificationBody = `Your account has been temporarily deactivated by system administration. Please contact administration for reinstatement.`;

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'DEACTIVATED',
            approvalNotes: notes?.trim() || 'Deactivated by administrator',
          },
        });
        break;
      }

      case 'ACTIVATE': {
        updatedStatus = 'ACTIVE';
        auditAction = 'ACCOUNT_REACTIVATED';
        notificationTitle = 'Account Reactivated';
        notificationBody = `Your account has been reactivated. You can continue accessing all platform services.`;

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'ACTIVE',
            approvalNotes: notes?.trim() || 'Reactivated by administrator',
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported workflow action: ${action}` }, { status: 400 });
    }

    // 1. Audit Log Entry
    await logAuditEvent({
      userId: admin.id,
      userEmail: admin.email,
      userRole: 'ADMIN',
      action: auditAction,
      module: 'APPROVALS',
      details: `${auditAction} performed for ${targetUser.email} (${targetUser.role}, ${targetUser.name}). Notes: ${notes || 'None'}`,
    });

    // 2. In-App Notification
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: notificationTitle,
        message: notificationBody,
        type: action === 'APPROVE' || action === 'ACTIVATE' ? 'SUCCESS' : action === 'REJECT' ? 'ALERT' : 'INFO',
        link: '/login',
      },
    });

    // 3. Email Notification
    await sendEmailNotification({
      to: targetUser.email,
      subject: `IVR Tech Solutions - ${notificationTitle}`,
      template: 'ACCOUNT_STATUS_CHANGE',
      variables: {
        name: targetUser.name,
        message: notificationBody,
        status: updatedStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account status successfully updated to ${updatedStatus}.`,
      status: updatedStatus,
    });
  } catch (err: any) {
    console.error('Approval action error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process approval action.' }, { status: 500 });
  }
}

