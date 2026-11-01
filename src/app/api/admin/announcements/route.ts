import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      include: {
        batch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Announcements fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'MENTOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, content, targetAudience, batchId, priority, channels } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const channelArray = channels && Array.isArray(channels) ? channels : ['IN_APP', 'EMAIL'];

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        targetAudience: targetAudience || 'ALL',
        batchId: batchId || null,
        priority: priority || 'NORMAL',
        channels: channelArray.join(','),
        authorId: adminUser.id,
      },
    });

    // Determine target students
    const studentQuery: Record<string, unknown> = {};
    if (targetAudience === 'BATCH' && batchId) {
      studentQuery.batchId = batchId;
    }

    const students = await prisma.studentProfile.findMany({
      where: studentQuery,
      include: { user: true },
    });

    // Dispatch notifications to target students
    for (const s of students) {
      await dispatchNotification({
        userId: s.userId,
        userEmail: s.user.email,
        userPhone: s.user.phone || undefined,
        userName: s.user.name,
        title: `Announcement: ${title}`,
        message: content,
        type: priority === 'URGENT' ? 'ALERT' : priority === 'HIGH' ? 'WARNING' : 'INFO',
        actionUrl: '/student/announcements',
        channels: channelArray as ('IN_APP' | 'EMAIL' | 'WHATSAPP')[],
      });
    }

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'ANNOUNCEMENT_CREATE',
      module: 'COMMUNICATIONS',
      details: `Created announcement "${title}" for ${targetAudience} (${students.length} students notified via ${channelArray.join(', ')})`,
    });

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement,
      recipientsCount: students.length,
    });
  } catch (error) {
    console.error('Announcement create error:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
