import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser, studentProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, status: true },
      }),
      prisma.studentProfile.findUnique({
        where: { userId: user.id },
        include: {
          batch: true,
          course: true,
          mentor: { include: { user: { select: { name: true, email: true, phone: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      user: dbUser || {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        status: 'ACTIVE',
      },
      studentProfile,
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, bio, resumeUrl } = await req.json();

    if (phone !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: phone ? phone.trim() : null },
      });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (studentProfile) {
      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: {
          bio: bio !== undefined ? bio : studentProfile.bio,
          resumeUrl: resumeUrl !== undefined ? resumeUrl : studentProfile.resumeUrl,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

