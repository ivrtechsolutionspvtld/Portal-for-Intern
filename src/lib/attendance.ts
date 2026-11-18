import prisma from '@/lib/prisma';

/**
 * Returns current date string formatted as YYYY-MM-DD in Asia/Kolkata (IST: UTC+5:30)
 */
export function getISTDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Returns exact startOfDay and endOfDay Date objects anchored to Asia/Kolkata day boundary (UTC+5:30)
 */
export function getISTDayBounds(dateStr?: string): { startOfDay: Date; endOfDay: Date; dateStr: string } {
  const targetDateStr = dateStr || getISTDateString();
  const startOfDay = new Date(`${targetDateStr}T00:00:00.000+05:30`);
  const endOfDay = new Date(`${targetDateStr}T23:59:59.999+05:30`);
  return { startOfDay, endOfDay, dateStr: targetDateStr };
}

/**
 * Automatically marks a student as PRESENT upon successful authenticated login.
 * Ensures:
 * 1. Single attendance record per student per 24-hr calendar day in Asia/Kolkata.
 * 2. Multiple logins do not create duplicate records.
 * 3. Pre-existing absent markers are flipped to PRESENT.
 */
export async function recordStudentLoginAttendance(studentProfileId: string, batchId?: string | null) {
  try {
    const { startOfDay, endOfDay } = getISTDayBounds();
    const now = new Date();

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: studentProfileId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingRecord) {
      if (existingRecord.status === 'ABSENT') {
        return await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status: 'PRESENT',
            method: 'AUTOMATIC_LOGIN',
            checkInTime: now,
            notes: 'Automatic attendance verified via authenticated student login',
          },
        });
      } else {
        // Already marked PRESENT / LATE: update checkout time without duplicate
        const diffMins = Math.round(
          (now.getTime() - (existingRecord.checkInTime ? new Date(existingRecord.checkInTime).getTime() : now.getTime())) / 60000
        );
        return await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            checkOutTime: now,
            durationMinutes: Math.max(diffMins, existingRecord.durationMinutes || 0),
          },
        });
      }
    }

    // Create fresh PRESENT record for today's IST period
    return await prisma.attendanceRecord.create({
      data: {
        studentId: studentProfileId,
        batchId: batchId || null,
        date: startOfDay,
        status: 'PRESENT',
        method: 'AUTOMATIC_LOGIN',
        checkInTime: now,
        notes: 'Automatic attendance verified via authenticated student login',
      },
    });
  } catch (err) {
    console.error('Error recording automatic student login attendance:', err);
    return null;
  }
}

/**
 * Automatic daily absence processor:
 * Evaluates all active enrolled students for a specific IST date.
 * If a student has no attendance record for the 24-hr window, marks them ABSENT.
 */
export async function processDailyAbsences(targetDateStr?: string) {
  try {
    const { startOfDay, endOfDay, dateStr } = getISTDayBounds(targetDateStr);

    // Fetch all active students
    const activeStudents = await prisma.studentProfile.findMany({
      where: {
        user: { status: 'ACTIVE' },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    let absentCount = 0;
    let presentCount = 0;

    for (const student of activeStudents) {
      const existing = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: student.id,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (!existing) {
        // Mark student as ABSENT
        await prisma.attendanceRecord.create({
          data: {
            studentId: student.id,
            batchId: student.batchId || null,
            date: startOfDay,
            status: 'ABSENT',
            method: 'AUTOMATIC_LOGIN',
            notes: 'Automatic Absence: No login within 24-hr period',
          },
        });
        absentCount++;
      } else if (existing.status === 'PRESENT' || existing.status === 'LATE') {
        presentCount++;
      } else {
        absentCount++;
      }
    }

    return {
      success: true,
      date: dateStr,
      totalActiveStudents: activeStudents.length,
      presentCount,
      absentCount,
    };
  } catch (err) {
    console.error('Error processing daily absences:', err);
    return { success: false, error: String(err) };
  }
}
