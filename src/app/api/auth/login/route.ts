import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

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

    // Version A: Automatic Portal Login Attendance for Students
    if (user.role === 'STUDENT' && user.studentProfile) {
      try {
        const settings = await prisma.systemSettings.findUnique({
          where: { id: 'ivr-global-settings' },
        });

        if (settings?.attendanceMode === 'AUTOMATIC') {
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          const existingRecord = await prisma.attendanceRecord.findFirst({
            where: {
              studentId: user.studentProfile.id,
              date: startOfDay,
            },
          });

          if (!existingRecord) {
            const graceParts = (settings.lateArrivalGraceTime || '10:00').split(':');
            const graceMinutes = parseInt(graceParts[0], 10) * 60 + parseInt(graceParts[1] || '0', 10);
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const isLate = currentMinutes > graceMinutes;

            await prisma.attendanceRecord.create({
              data: {
                studentId: user.studentProfile.id,
                batchId: user.studentProfile.batchId || null,
                date: startOfDay,
                status: isLate ? 'LATE' : 'PRESENT',
                method: 'AUTOMATIC_LOGIN',
                checkInTime: now,
                notes: isLate ? 'Automatic Login (Late arrival after grace period)' : 'Automatic Portal Login Attendance',
              },
            });

            await logAuditEvent({
              userId: user.id,
              userEmail: user.email,
              userRole: 'STUDENT',
              action: 'AUTOMATIC_LOGIN_ATTENDANCE',
              module: 'ATTENDANCE',
              details: `Recorded ${isLate ? 'LATE' : 'PRESENT'} attendance automatically on portal login at ${now.toLocaleTimeString()}`,
            });
          } else {
            // Update session activity time without duplicating attendance
            const diffMins = Math.round(
              (now.getTime() - (existingRecord.checkInTime ? new Date(existingRecord.checkInTime).getTime() : now.getTime())) / 60000
            );
            await prisma.attendanceRecord.update({
              where: { id: existingRecord.id },
              data: {
                checkOutTime: now,
                durationMinutes: Math.max(diffMins, existingRecord.durationMinutes || 0),
              },
            });
          }
        }
      } catch (attErr) {
        console.error('Automatic attendance record error:', attErr);
        // Does not block authentication if attendance logging encounters transient error
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
