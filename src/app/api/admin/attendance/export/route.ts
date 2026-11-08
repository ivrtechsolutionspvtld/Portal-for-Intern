import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { exportToExcel } from '@/lib/excel';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const records = await prisma.attendanceRecord.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            course: { select: { title: true, code: true } },
            mentor: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const exportData = records.map((r, idx) => ({
      'S.No': idx + 1,
      'Student ID': r.student.studentId || 'N/A',
      'Student Name': r.student.user.name,
      'Student Email': r.student.user.email,
      'Internship Course': r.student.course?.title || r.student.domain,
      'Assigned Mentor': r.student.mentor?.user?.name || 'Unassigned',
      'Date': r.date.toISOString().split('T')[0],
      'Status': r.status,
      'Method': r.method,
      'Check-in Time': r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : 'N/A',
      'Check-out Time': r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : 'N/A',
      'Session Duration (Mins)': r.durationMinutes || 0,
      'Marked By': r.markedBy || 'System',
      'Correction Reason': r.correctionReason || 'N/A',
      'Notes': r.notes || '',
    }));

    const excelBuffer = exportToExcel(exportData, 'Attendance_Registry');

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'ADMIN',
      action: 'EXPORT_ATTENDANCE_EXCEL',
      module: 'ATTENDANCE_MANAGEMENT',
      details: `Exported ${records.length} attendance records to Excel spreadsheet.`,
    });

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="IVR_Attendance_Registry_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Attendance export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export attendance records.' }, { status: 500 });
  }
}

