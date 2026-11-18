import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { recordStudentLoginAttendance } from '@/lib/attendance';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        studentProfile: true,
        mentorProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'Your account registration is pending administrator approval. You will receive an activation email once verified.' },
        { status: 403 }
      );
    }

    if (user.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Your registration application was not approved. Reason: ' + (user.approvalNotes || 'Does not meet eligibility criteria.') },
        { status: 403 }
      );
    }

    if (user.status === 'DEACTIVATED' || user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact admissions@ivrtechsolution.in' },
        { status: 403 }
      );
    }

    if (user.status === 'INFO_REQUESTED') {
      return NextResponse.json(
        { error: `Additional information requested: ${user.approvalNotes || 'Please contact administration to complete verification.'}` },
        { status: 403 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is not active. Please contact administration.' }, { status: 403 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Update lastLogin timestamp safely (non-blocking)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (updateErr) {
      console.warn('Non-blocking: could not update lastLogin timestamp', updateErr);
    }

    // Section 7: Automatic Daily Attendance (Asia/Kolkata 24-hr period)
    if (user.role === 'STUDENT' && user.studentProfile) {
      try {
        await recordStudentLoginAttendance(user.studentProfile.id, user.studentProfile.batchId);
        await logAuditEvent({
          userId: user.id,
          userEmail: user.email,
          userRole: 'STUDENT',
          action: 'AUTOMATIC_LOGIN_ATTENDANCE',
          module: 'ATTENDANCE',
          details: `Recorded PRESENT attendance automatically on student login in Asia/Kolkata timezone`,
        });
      } catch (attErr) {
        console.error('Automatic attendance record error:', attErr);
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Determine redirect route based on role
    let redirectUrl = '/student';
    if (user.role === 'ADMIN') redirectUrl = '/admin';
    if (user.role === 'MENTOR') redirectUrl = '/mentor';

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_LOGIN',
      module: 'AUTH',
      details: `Successful login for ${user.email} (${user.role})`,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      redirectUrl,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMessage = error?.message || 'Internal server error during authentication';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
