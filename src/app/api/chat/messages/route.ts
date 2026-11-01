import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { createInAppNotification } from '@/lib/notifications';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        mentor: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant =
      conversation.mentor.userId === user.id ||
      conversation.student.userId === user.id ||
      user.role === 'ADMIN';

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden: You are not authorized to view this conversation' }, { status: 403 });
    }

    // Mark messages from other user as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content, attachmentUrl, attachmentType } = await req.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        mentor: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant =
      conversation.mentor.userId === user.id || conversation.student.userId === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Unauthorized to post to this conversation' }, { status: 403 });
    }

    const recipientUserId =
      user.id === conversation.mentor.userId
        ? conversation.student.userId
        : conversation.mentor.userId;

    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
        isRead: false,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Notify recipient
    await createInAppNotification({
      userId: recipientUserId,
      title: `New message from ${user.name}`,
      message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
      type: 'INFO',
      link: user.role === 'MENTOR' ? '/student/messages' : '/mentor/messages',
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
