import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor, verifyStudentMentorAccess } from '@/lib/mentor-auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { mentorProfile } = auth.data;

    // Strict IDOR verification: Check if student exists and belongs to this mentor
    const accessCheck = await verifyStudentMentorAccess(mentorProfile.id, id);

    if (!accessCheck.exists || !accessCheck.student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    if (!accessCheck.isAuthorized) {
      // Log unauthorized IDOR attempt for security audit
      await logAuditEvent({
        userId: auth.data.user.id,
        userEmail: auth.data.user.email,
        userRole: 'MENTOR',
        action: 'SECURITY_VIOLATION_IDOR_ATTEMPT',
        module: 'MENTOR_STUDENT_PROFILE',
        details: `Mentor ${auth.data.user.email} attempted to view unauthorized student ID ${id} belonging to another mentor (${accessCheck.student.mentorId || 'unassigned'}).`,
      });

      return NextResponse.json(
        {
          error:
            'Forbidden: You are not authorized to view this student profile. This student is assigned to another mentor.',
        },
        { status: 403 }
      );
    }

    const studentProfileId = accessCheck.student.id;

    // Fetch comprehensive 9-tab data
    const [
      attendanceRecords,
      courseProgress,
      submissions,
      quizAttempts,
      mentorNotes,
      conversation,
      batchProjects,
    ] = await Promise.all([
      // 1. Attendance
      prisma.attendanceRecord.findMany({
        where: { studentId: studentProfileId },
        orderBy: { date: 'desc' },
      }),
      // 2. Learning Modules Progress
      prisma.courseProgress.findMany({
        where: { studentId: studentProfileId },
        include: { module: true },
        orderBy: { module: { orderIndex: 'asc' } },
      }),
      // 3. Submissions
      prisma.projectSubmission.findMany({
        where: { studentId: studentProfileId },
        include: { project: true },
        orderBy: { submittedAt: 'desc' },
      }),
      // 4. Quiz Attempts
      prisma.quizAttempt.findMany({
        where: { studentId: studentProfileId },
        include: { quiz: true },
        orderBy: { submittedAt: 'desc' },
      }),
      // 5. Mentor Private Notes
      prisma.mentorNote.findMany({
        where: { studentId: studentProfileId },
        include: { mentor: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      // 6. Direct Conversation
      prisma.conversation.findUnique({
        where: {
          mentorId_studentId: {
            mentorId: mentorProfile.id,
            studentId: studentProfileId,
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { sender: { select: { id: true, name: true, role: true } } },
          },
        },
      }),
      // 7. Batch / Domain Projects
      prisma.project.findMany({
        where: {
          OR: [
            { batchId: accessCheck.student.batchId || undefined },
            { domain: accessCheck.student.domain },
          ],
        },
        orderBy: { deadline: 'desc' },
      }),
    ]);

    // Calculate attendance statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const absentDays = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
    const attendanceStatus = attendancePercentage >= 75 ? 'ELIGIBLE' : 'AT_RISK';

    // Calculate course progress percentage
    const totalModules = courseProgress.length;
    const completedModules = courseProgress.filter((m) => m.completed).length;
    const courseProgressPercentage =
      totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    return NextResponse.json({
      success: true,
      student: {
        // Tab 1: Overview
        id: accessCheck.student.id,
        userId: accessCheck.student.userId,
        studentId: accessCheck.student.studentId,
        name: accessCheck.student.user.name,
        email: accessCheck.student.user.email,
        phone: accessCheck.student.user.phone,
        avatar: accessCheck.student.user.avatar,
        status: accessCheck.student.user.status,
        domain: accessCheck.student.domain,
        course: accessCheck.student.course,
        batch: accessCheck.student.batch,
        mentor: accessCheck.student.mentor,
        duration: accessCheck.student.duration || '8 Weeks',
        startDate: accessCheck.student.startDate,
        endDate: accessCheck.student.endDate,
        enrollmentDate: accessCheck.student.enrollmentDate,
        cgpa: accessCheck.student.cgpa,
        resumeUrl: accessCheck.student.resumeUrl,
        bio: accessCheck.student.bio,

        // Tab 2: Personal Details (Strictly Read-Only for Mentor)
        personalDetails: {
          name: accessCheck.student.user.name,
          email: accessCheck.student.user.email,
          phone: accessCheck.student.user.phone,
          college: accessCheck.student.college,
          department: accessCheck.student.department,
          degree: accessCheck.student.degree,
          academicYear: accessCheck.student.academicYear,
          graduationYear: accessCheck.student.graduationYear,
          regNumber: accessCheck.student.regNumber,
          dob: accessCheck.student.dob,
          address: accessCheck.student.address,
          enrollmentDate: accessCheck.student.enrollmentDate,
        },

        // Tab 3: Attendance Details
        attendance: {
          totalDays,
          presentDays,
          absentDays,
          percentage: attendancePercentage,
          status: attendanceStatus,
          records: attendanceRecords,
        },

        // Tab 4: Learning Progress
        learningProgress: {
          totalModules,
          completedModules,
          percentage: courseProgressPercentage,
          modules: courseProgress,
        },

        // Tab 5: Assignments & Submissions
        assignments: submissions,

        // Tab 6: Quiz Results
        quizResults: quizAttempts,

        // Tab 7: Capstone Projects
        projects: batchProjects,

        // Tab 8: Mentor Private Notes & Feedback
        mentorNotes,

        // Tab 9: Communication History
        conversation: conversation
          ? {
              id: conversation.id,
              messages: conversation.messages.reverse(),
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error('Mentor student profile error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}

/**
 * POST: Add private mentor note for assigned student
 * Only authorized mentors can add notes to their assigned students.
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedMentor(req);
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    const { mentorProfile } = auth.data;

    // Strict IDOR verification
    const accessCheck = await verifyStudentMentorAccess(mentorProfile.id, id);
    if (!accessCheck.exists || !accessCheck.student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    if (!accessCheck.isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot add notes to a student not assigned to you.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { note, category = 'GENERAL', isPrivate = true } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note content is required.' }, { status: 400 });
    }

    const newNote = await prisma.mentorNote.create({
      data: {
        mentorId: mentorProfile.id,
        studentId: accessCheck.student.id,
        note: note.trim(),
        category,
        isPrivate: Boolean(isPrivate),
      },
    });

    await logAuditEvent({
      userId: auth.data.user.id,
      userEmail: auth.data.user.email,
      userRole: 'MENTOR',
      action: 'MENTOR_NOTE_ADDED',
      module: 'MENTOR_STUDENT_NOTES',
      details: `Added note for assigned student ${accessCheck.student.user.name} (${accessCheck.student.studentId}). Category: ${category}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Note saved successfully.',
      note: newNote,
    });
  } catch (err: any) {
    console.error('Add mentor note error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save note' },
      { status: 500 }
    );
  }
}

