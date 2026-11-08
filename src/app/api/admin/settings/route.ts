import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'ivr-global-settings' },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'ivr-global-settings',
          internshipDurationDays: 60,
          minAttendancePercent: 80.0,
          minProjectScore: 70,
          registrationFeeINR: 499.0,
          programFeeINR: 4999.0,
          currency: 'INR',
          contactEmail: 'admin@ivrtechsolution.in',
          contactPhone: '+91 8143177907',
          officeAddress: 'Remote-First Operations (Pan-India)',
          mandatoryStudentFields: 'name,email,phone,college,department,graduationYear,domain',
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch system settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json();

    const updated = await prisma.systemSettings.upsert({
      where: { id: 'ivr-global-settings' },
      update: {
        internshipDurationDays: body.internshipDurationDays !== undefined ? parseInt(body.internshipDurationDays, 10) : undefined,
        minAttendancePercent: body.minAttendancePercent !== undefined ? parseFloat(body.minAttendancePercent) : undefined,
        minProjectScore: body.minProjectScore !== undefined ? parseInt(body.minProjectScore, 10) : undefined,
        attendanceMode: body.attendanceMode || undefined,
        workHoursStart: body.workHoursStart || undefined,
        workHoursEnd: body.workHoursEnd || undefined,
        lateArrivalGraceTime: body.lateArrivalGraceTime || undefined,
        minSessionDurationMinutes: body.minSessionDurationMinutes !== undefined ? parseInt(body.minSessionDurationMinutes, 10) : undefined,
        enableAttendanceCorrections: body.enableAttendanceCorrections !== undefined ? Boolean(body.enableAttendanceCorrections) : undefined,
        registrationFeeINR: body.registrationFeeINR !== undefined ? parseFloat(body.registrationFeeINR) : undefined,
        programFeeINR: body.programFeeINR !== undefined ? parseFloat(body.programFeeINR) : undefined,
        contactEmail: body.contactEmail || undefined,
        contactPhone: body.contactPhone || undefined,
        officeAddress: body.officeAddress || undefined,
        mandatoryStudentFields: body.mandatoryStudentFields || undefined,
      },
      create: {
        id: 'ivr-global-settings',
        internshipDurationDays: 60,
        minAttendancePercent: 75.0,
        minProjectScore: 70,
        attendanceMode: body.attendanceMode || 'AUTOMATIC',
        workHoursStart: body.workHoursStart || '09:30',
        workHoursEnd: body.workHoursEnd || '18:30',
        lateArrivalGraceTime: body.lateArrivalGraceTime || '10:00',
        minSessionDurationMinutes: 30,
        enableAttendanceCorrections: true,
        registrationFeeINR: 499.0,
        programFeeINR: 4999.0,
        currency: 'INR',
        contactEmail: 'admin@ivrtechsolution.in',
        contactPhone: '+91 8143177907',
        officeAddress: 'Remote-First Operations (Pan-India)',
        mandatoryStudentFields: body.mandatoryStudentFields || 'name,email,phone,college,department,graduationYear',
      },
    });

    await logAuditEvent({
      userId: admin.id,
      userEmail: admin.email,
      userRole: 'ADMIN',
      action: 'SYSTEM_SETTINGS_UPDATE',
      module: 'SETTINGS',
      details: `Updated platform configuration: Attendance Mode: ${updated.attendanceMode}, Min Attendance: ${updated.minAttendancePercent}%, Grace Window: ${updated.lateArrivalGraceTime}`,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Settings PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update system settings' }, { status: 500 });
  }
}

