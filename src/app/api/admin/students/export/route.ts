import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { exportToExcel } from '@/lib/excel';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        batch: true,
        mentor: { include: { user: true } },
        attendanceRecords: true,
        submissions: true,
        certificate: true,
      },
      orderBy: { enrollmentDate: 'desc' },
    });

    const exportData = students.map((s, index) => {
      const totalAtt = s.attendanceRecords.length;
      const present = s.attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attRate = totalAtt > 0 ? `${Math.round((present / totalAtt) * 100)}%` : '100%';
      const approvedProjects = s.submissions.filter((sub) => sub.status === 'APPROVED').length;

      return {
        '#': index + 1,
        'Full Name': s.user.name,
        'Email Address': s.user.email,
        'Phone Number': s.user.phone || 'N/A',
        'Account Status': s.user.status,
        'College / University': s.college,
        'Department': s.department,
        'Graduation Year': s.graduationYear,
        'Domain': s.domain,
        'Batch': s.batch?.name || 'Unassigned',
        'Assigned Mentor': s.mentor?.user.name || 'Unassigned',
        'Attendance %': attRate,
        'Approved Projects': approvedProjects,
        'Certificate Status': s.certificate ? `Issued (${s.certificate.certificateNumber})` : 'Not Issued',
        'Enrolled On': s.enrollmentDate.toISOString().split('T')[0],
      };
    });

    const buffer = exportToExcel(exportData, 'Students_Roster');

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="IVR_Students_Export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export students roster' }, { status: 500 });
  }
}
