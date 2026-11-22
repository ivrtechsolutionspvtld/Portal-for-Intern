import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getAuthFromRequest } from '@/lib/auth';

export interface AuthenticatedMentorResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string | null;
    phone?: string | null;
  };
  mentorProfile: {
    id: string;
    mentorId: string | null;
    employeeId: string | null;
    userId: string;
    designation: string;
    department: string;
    expertise: string;
    experience: string | null;
    assignedProgram: string | null;
    bio: string | null;
    maxStudents: number;
  };
}

/**
 * Validates that the requesting user is an active MENTOR and returns their user record and mentor profile.
 * Supports both Cookie session and Bearer Authorization header.
 */
export async function getAuthenticatedMentor(req?: Request): Promise<
  | { success: true; data: AuthenticatedMentorResult }
  | { success: false; response: NextResponse }
> {
  let user: any = null;

  if (req) {
    const authData = await getAuthFromRequest(req);
    if (authData) {
      user = await prisma.user.findUnique({
        where: { id: authData.id },
        include: { mentorProfile: true },
      });
    }
  }

  if (!user) {
    user = await getSessionUser();
    if (user) {
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { mentorProfile: true },
      });
    }
  }

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (user.status !== 'ACTIVE') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden: Account is inactive or pending approval' },
        { status: 403 }
      ),
    };
  }

  if (user.role !== 'MENTOR') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden: Mentor access required' },
        { status: 403 }
      ),
    };
  }

  if (!user.mentorProfile) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Mentor profile not found for this account' },
        { status: 404 }
      ),
    };
  }

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
      mentorProfile: user.mentorProfile,
    },
  };
}

/**
 * Enforces server-side IDOR defense:
 * Confirms that a student is assigned to the authenticated mentor.
 */
export async function verifyStudentMentorAccess(
  mentorProfileId: string,
  studentIdOrProfileId: string
) {
  const student = await prisma.studentProfile.findFirst({
    where: {
      OR: [{ id: studentIdOrProfileId }, { userId: studentIdOrProfileId }],
    },
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
      batch: true,
      course: true,
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!student) {
    return { exists: false, isAuthorized: false, student: null };
  }

  const isAuthorized = student.mentorId === mentorProfileId;
  return { exists: true, isAuthorized, student };
}
