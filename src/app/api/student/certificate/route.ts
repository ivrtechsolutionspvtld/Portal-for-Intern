import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        batch: true,
        certificate: true,
        attendanceRecords: true,
        submissions: { include: { project: true } },
        paymentOrders: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Calculate metrics
    const totalAtt = student.attendanceRecords.length;
    const presentAtt = student.attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    const approvedProjects = student.submissions.filter((s) => s.status === 'APPROVED').length;
    const totalProjects = student.submissions.length;

    const isProgramFeePaid = student.paymentOrders.some(
      (o) => o.feeType === 'PROGRAM_FEE' && o.status === 'SUCCESS'
    );

    const isAttendanceMet = attendancePercent >= 80;
    const isProjectsMet = totalProjects > 0 && approvedProjects === totalProjects;
    const isFeesMet = isProgramFeePaid;

    const isEligible = isAttendanceMet && isProjectsMet && isFeesMet;

    return NextResponse.json({
      certificate: student.certificate,
      hasCertificate: !!student.certificate,
      eligibility: {
        isEligible,
        criteria: [
          {
            label: 'Attendance Requirement (Min 80%)',
            met: isAttendanceMet,
            currentValue: `${attendancePercent}%`,
            requiredValue: '80%',
          },
          {
            label: 'Milestone Projects Completion (100% Approved)',
            met: isProjectsMet,
            currentValue: `${approvedProjects}/${totalProjects || 1} Approved`,
            requiredValue: 'All Projects Approved',
          },
          {
            label: 'Program Fee Settlement',
            met: isFeesMet,
            currentValue: isFeesMet ? 'Settled' : 'Pending',
            requiredValue: 'Full Fee Settled',
          },
        ],
      },
      studentName: user.name,
      domain: student.domain,
      batchName: student.batch?.name || 'Internship Batch',
    });
  } catch (error) {
    console.error('Student certificate fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificate status' }, { status: 500 });
  }
}
