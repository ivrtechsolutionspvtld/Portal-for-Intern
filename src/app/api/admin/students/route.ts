import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const domain = searchParams.get('domain') || '';
    const batchId = searchParams.get('batchId') || '';
    const status = searchParams.get('status') || '';

    const whereClause: Record<string, unknown> = {};

    if (domain) {
      whereClause.domain = domain;
    }
    if (batchId) {
      whereClause.batchId = batchId;
    }
    if (status) {
      whereClause.user = { status };
    }

    if (search) {
      whereClause.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { college: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const students = await prisma.studentProfile.findMany({
      where: whereClause,
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
        batch: {
          select: { id: true, name: true, domain: true },
        },
        mentor: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        certificate: {
          select: { certificateNumber: true, status: true },
        },
        attendanceRecords: {
          select: { status: true },
        },
        submissions: {
          select: { status: true, score: true },
        },
      },
      orderBy: { enrollmentDate: 'desc' },
    });

    // Format with computed attendance % and project completion
    const formatted = students.map((s) => {
      const totalAtt = s.attendanceRecords.length;
      const presentAtt = s.attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;
      const completedProjects = s.submissions.filter((sub) => sub.status === 'APPROVED').length;

      return {
        id: s.id,
        userId: s.userId,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        avatar: s.user.avatar,
        status: s.user.status,
        college: s.college,
        department: s.department,
        graduationYear: s.graduationYear,
        domain: s.domain,
        cgpa: s.cgpa,
        resumeUrl: s.resumeUrl,
        batch: s.batch ? { id: s.batch.id, name: s.batch.name } : null,
        mentor: s.mentor ? { id: s.mentor.id, name: s.mentor.user.name } : null,
        attendancePercent,
        completedProjects,
        hasCertificate: !!s.certificate,
        certificateNumber: s.certificate?.certificateNumber || null,
        createdAt: s.user.createdAt,
      };
    });

    return NextResponse.json({ students: formatted });
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch students list' }, { status: 500 });
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
      college,
      department,
      graduationYear,
      domain,
      batchId,
      mentorId,
      password,
    } = await req.json();

    if (!name || !email || !college || !department || !graduationYear || !domain) {
      return NextResponse.json({ error: 'Missing mandatory student information' }, { status: 400 });
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: `User with email ${email} already exists.` }, { status: 409 });
    }

    const plainPassword = password || 'Student@IVR2026!';
    const passwordHash = await hashPassword(plainPassword);

    // Create User & StudentProfile in a transaction
    const newStudent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          passwordHash,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          college: college.trim(),
          department: department.trim(),
          graduationYear: parseInt(graduationYear, 10),
          domain,
          batchId: batchId || null,
          mentorId: mentorId || null,
        },
      });

      return { user, profile };
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'STUDENT_MANUAL_CREATE',
      module: 'STUDENT_MANAGEMENT',
      details: `Created student account for ${name} (${email}) in domain ${domain}`,
    });

    // Send welcome credentials email
    await dispatchNotification({
      userId: newStudent.user.id,
      userEmail: newStudent.user.email,
      userName: newStudent.user.name,
      title: 'Welcome to IVR Enterprise Internship Portal',
      message: `Your student portal credentials have been provisioned.<br><br><strong>Login Email:</strong> ${newStudent.user.email}<br><strong>Initial Password:</strong> ${plainPassword}<br><br>Please log in and update your security settings.`,
      type: 'SUCCESS',
      actionUrl: 'http://localhost:3000/login',
      channels: ['EMAIL'],
    });

    return NextResponse.json({
      success: true,
      message: 'Student account created successfully',
      student: newStudent,
    });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Failed to create student account' }, { status: 500 });
  }
}
