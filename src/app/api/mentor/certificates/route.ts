import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedMentor, verifyStudentMentorAccess } from '@/lib/mentor-auth';
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

    // Fetch assigned students with their eligibility criteria
    const students = await prisma.studentProfile.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attendanceRecords: true,
        submissions: { where: { status: 'APPROVED' } },
        quizAttempts: { where: { passed: true } },
        certificate: true,
        certificateRecommendations: {
          where: { mentorId: mentorProfile.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const candidateList = students.map((s) => {
      const totalAtt = s.attendanceRecords.length;
      const presentAtt = s.attendanceRecords.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;
      const approvedProjectsCount = s.submissions.length;
      const quizzesPassedCount = s.quizAttempts.length;

      const isEligible = attendancePercent >= 75 && approvedProjectsCount >= 1;
      const existingRec = s.certificateRecommendations[0] || null;

      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        studentId: s.studentId,
        domain: s.domain,
        attendancePercent,
        approvedProjectsCount,
        quizzesPassedCount,
        hasCertificate: !!s.certificate,
        certificateNumber: s.certificate?.certificateNumber || null,
        isEligible,
        recommendation: existingRec
          ? {
              id: existingRec.id,
              status: existingRec.status,
              performanceRating: existingRec.performanceRating,
              feedback: existingRec.feedback,
              createdAt: existingRec.createdAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      candidates: candidateList,
    });
  } catch (error: any) {
    console.error('Mentor certificates fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificate candidates' },
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
      studentId,
      performanceRating = 'EXCELLENT',
      feedback,
    } = body;

    if (!studentId || !feedback || !feedback.trim()) {
      return NextResponse.json(
        { error: 'Student ID and performance remarks are required.' },
        { status: 400 }
      );
    }

    // Verify student belongs to this mentor (IDOR prevention)
    const accessCheck = await verifyStudentMentorAccess(mentorProfile.id, studentId);
    if (!accessCheck.exists || !accessCheck.student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    if (!accessCheck.isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot recommend a student not assigned to you.' },
        { status: 403 }
      );
    }

    // Create or update recommendation
    const recommendation = await prisma.certificateRecommendation.create({
      data: {
        studentId: accessCheck.student.id,
        mentorId: mentorProfile.id,
        performanceRating,
        feedback: feedback.trim(),
        status: 'PENDING',
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: 'MENTOR',
      action: 'CERTIFICATE_RECOMMENDATION_SUBMITTED',
      module: 'CERTIFICATES',
      details: `Recommended student ${accessCheck.student.user.name} (${accessCheck.student.studentId}) for certificate. Rating: ${performanceRating}.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate recommendation submitted for Administrator approval.',
      recommendation,
    });
  } catch (error: any) {
    console.error('Submit recommendation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit recommendation' },
      { status: 500 }
    );
  }
}

