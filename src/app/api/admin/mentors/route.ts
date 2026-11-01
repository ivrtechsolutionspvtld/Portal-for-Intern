import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const mentors = await prisma.mentorProfile.findMany({
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
        assignedStudents: {
          select: { id: true, user: { select: { name: true, email: true } } },
        },
        batches: {
          select: { id: true, name: true, domain: true, status: true },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const formatted = mentors.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      avatar: m.user.avatar,
      status: m.user.status,
      designation: m.designation,
      department: m.department,
      expertise: m.expertise,
      bio: m.bio,
      maxStudents: m.maxStudents,
      activeStudentsCount: m.assignedStudents.length,
      assignedBatches: m.batches,
      assignedStudents: m.assignedStudents.map((s) => ({ id: s.id, name: s.user.name, email: s.user.email })),
    }));

    return NextResponse.json({ mentors: formatted });
  } catch (error) {
    console.error('Mentors fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { name, email, phone, designation, department, expertise, bio, maxStudents, password } = await req.json();

    if (!name || !email || !designation || !department) {
      return NextResponse.json({ error: 'Name, email, designation, and department are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password || 'Mentor@IVR2026!');

    const newMentor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          passwordHash,
          role: 'MENTOR',
          status: 'ACTIVE',
        },
      });

      const profile = await tx.mentorProfile.create({
        data: {
          userId: user.id,
          designation: designation.trim(),
          department: department.trim(),
          expertise: expertise || 'Software Engineering',
          bio: bio || null,
          maxStudents: maxStudents ? parseInt(maxStudents, 10) : 30,
        },
      });

      return { user, profile };
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'MENTOR_CREATE',
      module: 'MENTOR_MANAGEMENT',
      details: `Created mentor ${name} (${email}) - ${designation}`,
    });

    return NextResponse.json({ success: true, mentor: newMentor });
  } catch (error) {
    console.error('Mentor create error:', error);
    return NextResponse.json({ error: 'Failed to create mentor' }, { status: 500 });
  }
}
