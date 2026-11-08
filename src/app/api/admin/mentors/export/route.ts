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

    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: true,
        assignedStudents: { include: { user: true } },
        batches: true,
      },
      orderBy: { user: { name: 'asc' } },
    });

    const exportData = mentors.map((m, index) => ({
      '#': index + 1,
      'Mentor ID': m.mentorId || `IVR-MEN-${m.id.slice(0, 6).toUpperCase()}`,
      'Employee ID': m.employeeId || 'N/A',
      'Full Name': m.user.name,
      'Email Address': m.user.email,
      'Phone Number': m.user.phone || 'N/A',
      'Account Status': m.user.status,
      'Designation': m.designation,
      'Department': m.department,
      'Area of Expertise': m.expertise,
      'Experience': m.experience || '2 Years',
      'Assigned Program': m.assignedProgram || 'General',
      'Active Students Count': m.assignedStudents.length,
      'Max Student Capacity': m.maxStudents,
      'Assigned Batches': m.batches.map((b) => b.name).join(', ') || 'None',
      'Created On': m.user.createdAt.toISOString().split('T')[0],
    }));

    const buffer = exportToExcel(exportData, 'Mentors_Roster');

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="IVR_Mentors_Export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Mentor export error:', error);
    return NextResponse.json({ error: 'Failed to export mentors' }, { status: 500 });
  }
}

