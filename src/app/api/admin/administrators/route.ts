import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { sendEmailNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Administrator privileges required.' }, { status: 403 });
    }

    const administrators = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        adminId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isDemo: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        approvalNotes: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const activeCount = administrators.filter((a) => a.status === 'ACTIVE').length;

    return NextResponse.json({
      success: true,
      administrators,
      totalCount: administrators.length,
      activeCount,
      currentAdminId: admin.id,
    });
  } catch (err: any) {
    console.error('Fetch administrators error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch administrators' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentAdmin = await getSessionUser();
    if (!currentAdmin || currentAdmin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Only an existing authorized administrator can provision new admin accounts.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, password, notes } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Administrator Name, Email Address, and Initial Password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json({ error: `An account with email ${normalizedEmail} already exists in the system.` }, { status: 409 });
    }

    // Generate unique Administrator ID
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    let adminId = `IVR-ADM-${String(totalAdmins + 1).padStart(3, '0')}`;
    let isUnique = false;
    while (!isUnique) {
      const found = await prisma.user.findUnique({ where: { adminId } });
      if (!found) isUnique = true;
      else adminId = `IVR-ADM-${Date.now().toString(36).toUpperCase()}`;
    }

    const passwordHash = await hashPassword(password);

    const newAdmin = await prisma.user.create({
      data: {
        adminId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedBy: currentAdmin.email,
        approvalNotes: notes?.trim() || `Created by administrator ${currentAdmin.email}`,
      },
    });

    // Record audit event
    await logAuditEvent({
      userId: currentAdmin.id,
      userEmail: currentAdmin.email,
      userRole: 'ADMIN',
      action: 'ADMIN_ACCOUNT_CREATED',
      module: 'ADMIN_MANAGEMENT',
      details: `Administrator ${currentAdmin.name} created full administrator account for ${newAdmin.name} (${newAdmin.email}, Admin ID: ${adminId}) with full administrative access permissions.`,
    });

    // Dispatch transactional email
    await sendEmailNotification({
      to: newAdmin.email,
      subject: 'IVR Tech Solutions - Full Administrator Account Provisioned',
      template: 'ACCOUNT_STATUS_CHANGE',
      variables: {
        name: newAdmin.name,
        status: 'ACTIVE',
        message: `Your Full Administrator account (${adminId}) has been created by ${currentAdmin.name}. You now have full operational privileges across all platform modules.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Full Administrator account provisioned successfully. Assigned Admin ID: ${adminId}.`,
      administrator: {
        id: newAdmin.id,
        adminId: newAdmin.adminId,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        status: newAdmin.status,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Create administrator error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create administrator account.' }, { status: 500 });
  }
}

