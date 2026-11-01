import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json({ announcements: [] });
    }

    // Announcements for all or student's specific batch
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: 'BATCH', batchId: student.batchId || undefined },
        ],
      },
      include: {
        batch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Student announcements error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
