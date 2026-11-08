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
            isDemo: true,
            createdAt: true,
          },
        },
        assignedStudents: {
          select: {
            id: true,
            studentId: true,
            domain: true,
            college: true,
            department: true,
            user: { select: { name: true, email: true, phone: true } },
          },
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
      mentorId: m.mentorId || `IVR-MEN-${m.id.slice(0, 6).toUpperCase()}`,
      employeeId: m.employeeId || `EMP-${m.id.slice(0, 4).toUpperCase()}`,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      avatar: m.user.avatar,
      status: m.user.status,
      isDemo: m.user.isDemo,
      designation: m.designation,
      department: m.department,
      expertise: m.expertise,
      experience: m.experience || '2 Years',
      assignedProgram: m.assignedProgram || 'Full-Stack Web Development',
      bio: m.bio,
      maxStudents: m.maxStudents,
      activeStudentsCount: m.assignedStudents.length,
      assignedBatches: m.batches,
      assignedStudents: m.assignedStudents.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        college: s.college,
        domain: s.domain,
      })),
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

    const {
      name,
      email,
      phone,
      mentorId: customMentorId,
      employeeId: customEmployeeId,
      designation,
      department,
      expertise,
      experience = '2 Years',
      assignedProgram = 'Full-Stack Web Development',
      bio,
      maxStudents = 30,
      status = 'ACTIVE',
      isDemo = false,
      password,
    } = await req.json();

    if (!name || !email || !designation || !department) {
      return NextResponse.json({ error: 'Name, email, designation, and department are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const year = new Date().getFullYear();
    let assignedMentorId = customMentorId?.trim();
    if (!assignedMentorId) {
      assignedMentorId = `IVR-MEN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      let isUnique = false;
      while (!isUnique) {
        const found = await prisma.mentorProfile.findUnique({ where: { mentorId: assignedMentorId } });
        if (!found) isUnique = true;
        else assignedMentorId = `IVR-MEN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    let assignedEmpId = customEmployeeId?.trim() || `EMP-${assignedMentorId}`;

    const passwordHash = await hashPassword(password || 'Mentor@IVR2026!');

    const newMentor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          passwordHash,
          role: 'MENTOR',
          status: status || 'ACTIVE',
          isDemo: !!isDemo,
          approvedAt: status === 'ACTIVE' ? new Date() : null,
          approvedBy: status === 'ACTIVE' ? adminUser.email : null,
        },
      });

      const profile = await tx.mentorProfile.create({
        data: {
          userId: user.id,
          mentorId: assignedMentorId,
          employeeId: assignedEmpId,
          designation: designation.trim(),
          department: department.trim(),
          expertise: expertise || 'Software Engineering',
          experience: experience?.trim() || '2 Years',
          assignedProgram: assignedProgram || 'Full-Stack Web Development',
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
