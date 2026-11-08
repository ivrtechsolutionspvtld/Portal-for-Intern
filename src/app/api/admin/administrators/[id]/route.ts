import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentAdmin = await getSessionUser();
    if (!currentAdmin || currentAdmin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await params;
    const adminUser = await prisma.user.findUnique({
      where: { id, role: 'ADMIN' },
      select: {
        id: true,
        adminId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        approvalNotes: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Administrator account not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, administrator: adminUser });
  } catch (err: any) {
    console.error('Fetch admin detail error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch administrator.' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentAdmin = await getSessionUser();
    if (!currentAdmin || currentAdmin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, phone, status, newPassword, notes } = body;

    const targetAdmin = await prisma.user.findUnique({
      where: { id, role: 'ADMIN' },
    });

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Administrator account not found.' }, { status: 404 });
    }

    // CRITICAL SAFETY CHECK: Cannot deactivate the last active administrator
    if (status && status !== 'ACTIVE' && targetAdmin.status === 'ACTIVE') {
      const activeCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' },
      });
      if (activeCount <= 1) {
        return NextResponse.json(
          { error: 'Security Protection: Cannot deactivate the last remaining active administrator account.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (status) updateData.status = status;
    if (notes) updateData.approvalNotes = notes.trim();

    let passwordResetMsg = '';
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(newPassword);
      passwordResetMsg = ' (Password has been reset)';
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      userId: currentAdmin.id,
      userEmail: currentAdmin.email,
      userRole: 'ADMIN',
      action: 'ADMIN_ACCOUNT_UPDATED',
      module: 'ADMIN_MANAGEMENT',
      details: `Administrator ${currentAdmin.name} updated admin ${targetAdmin.name} (${targetAdmin.adminId || targetAdmin.email}). Status: ${updated.status}.${passwordResetMsg}`,
    });

    return NextResponse.json({
      success: true,
      message: `Administrator details successfully updated.${passwordResetMsg}`,
      administrator: {
        id: updated.id,
        adminId: updated.adminId,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        status: updated.status,
      },
    });
  } catch (err: any) {
    console.error('Update administrator error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update administrator.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentAdmin = await getSessionUser();
    if (!currentAdmin || currentAdmin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await params;

    // CRITICAL SAFETY CHECK: Cannot delete own account while logged in
    if (currentAdmin.id === id) {
      return NextResponse.json(
        { error: 'Security Protection: You cannot delete your own logged-in administrator account.' },
        { status: 400 }
      );
    }

    // CRITICAL SAFETY CHECK: Cannot delete the last active administrator
    const activeCount = await prisma.user.count({
      where: { role: 'ADMIN', status: 'ACTIVE' },
    });
    if (activeCount <= 1) {
      return NextResponse.json(
        { error: 'Security Protection: Cannot delete the last active administrator in the system.' },
        { status: 400 }
      );
    }

    const targetAdmin = await prisma.user.findUnique({
      where: { id, role: 'ADMIN' },
    });

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Administrator account not found.' }, { status: 404 });
    }

    // Delete administrator
    await prisma.user.delete({ where: { id } });

    await logAuditEvent({
      userId: currentAdmin.id,
      userEmail: currentAdmin.email,
      userRole: 'ADMIN',
      action: 'ADMIN_ACCOUNT_DELETED',
      module: 'ADMIN_MANAGEMENT',
      details: `Administrator ${currentAdmin.name} permanently revoked/deleted administrator account for ${targetAdmin.name} (${targetAdmin.email}, Admin ID: ${targetAdmin.adminId || 'N/A'}).`,
    });

    return NextResponse.json({
      success: true,
      message: `Administrator account for ${targetAdmin.name} successfully deleted.`,
    });
  } catch (err: any) {
    console.error('Delete administrator error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete administrator.' }, { status: 500 });
  }
}

