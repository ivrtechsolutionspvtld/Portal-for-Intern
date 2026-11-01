import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'MENTOR') {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!mentor) {
        return NextResponse.json({ conversations: [] });
      }

      // Fetch or auto-create conversations with assigned students
      const assignedStudents = await prisma.studentProfile.findMany({
        where: { mentorId: mentor.id },
        include: { user: true, batch: true },
      });

      const conversations = [];
      for (const student of assignedStudents) {
        let convo = await prisma.conversation.findUnique({
          where: {
            mentorId_studentId: {
              mentorId: mentor.id,
              studentId: student.id,
            },
          },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        if (!convo) {
          convo = await prisma.conversation.create({
            data: {
              mentorId: mentor.id,
              studentId: student.id,
            },
            include: {
              messages: true,
            },
          });
        }

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: convo.id,
            senderId: { not: user.id },
            isRead: false,
          },
        });

        conversations.push({
          id: convo.id,
          partner: {
            id: student.user.id,
            name: student.user.name,
            email: student.user.email,
            avatar: student.user.avatar,
            role: 'STUDENT',
            batchName: student.batch?.name || 'Assigned Student',
          },
          lastMessage: convo.messages[0] || null,
          unreadCount,
          updatedAt: convo.updatedAt,
        });
      }

      return NextResponse.json({ conversations });
    }

    if (user.role === 'STUDENT') {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
        include: {
          mentor: { include: { user: true } },
        },
      });

      if (!student || !student.mentorId || !student.mentor) {
        return NextResponse.json({ conversations: [] });
      }

      let convo = await prisma.conversation.findUnique({
        where: {
          mentorId_studentId: {
            mentorId: student.mentorId,
            studentId: student.id,
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!convo) {
        convo = await prisma.conversation.create({
          data: {
            mentorId: student.mentorId,
            studentId: student.id,
          },
          include: { messages: true },
        });
      }

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: convo.id,
          senderId: { not: user.id },
          isRead: false,
        },
      });

      return NextResponse.json({
        conversations: [
          {
            id: convo.id,
            partner: {
              id: student.mentor.user.id,
              name: student.mentor.user.name,
              email: student.mentor.user.email,
              avatar: student.mentor.user.avatar,
              role: 'MENTOR',
              designation: student.mentor.designation,
            },
            lastMessage: convo.messages[0] || null,
            unreadCount,
            updatedAt: convo.updatedAt,
          },
        ],
      });
    }

    return NextResponse.json({ conversations: [] });
  } catch (error) {
    console.error('Chat conversations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
