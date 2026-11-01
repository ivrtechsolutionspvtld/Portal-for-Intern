import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { parseAndValidateStudentExcel, StudentImportRow } from '@/lib/excel';
import { logAuditEvent } from '@/lib/audit';
import { dispatchNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const action = (formData.get('action') as string) || 'preview';
    const file = formData.get('file') as File | null;

    if (!file && action === 'preview') {
      return NextResponse.json({ error: 'No Excel file uploaded' }, { status: 400 });
    }

    // Collect all existing emails in database for duplicate detection
    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    if (action === 'preview' && file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const validation = parseAndValidateStudentExcel(buffer, existingEmailSet);

      return NextResponse.json({
        success: true,
        preview: {
          totalRows: validation.totalRows,
          validCount: validation.validRows.length,
          errorCount: validation.errors.length,
          errors: validation.errors,
          duplicates: validation.duplicates,
          sampleValidRows: validation.validRows.slice(0, 10),
          allValidRows: validation.validRows,
        },
      });
    }

    if (action === 'commit') {
      const rowsJson = formData.get('rows') as string;
      if (!rowsJson) {
        return NextResponse.json({ error: 'No validated rows provided for commit' }, { status: 400 });
      }

      const rows: StudentImportRow[] = JSON.parse(rowsJson);
      const defaultPasswordHash = await hashPassword('Student@IVR2026!');

      // Fetch existing batches for lookup
      const batches = await prisma.batch.findMany({ select: { id: true, name: true } });
      const batchMap = new Map(batches.map((b) => [b.name.toLowerCase().trim(), b.id]));

      let importedCount = 0;
      const skippedEmails: string[] = [];

      for (const row of rows) {
        // Double check duplicate in real-time
        if (existingEmailSet.has(row.email.toLowerCase().trim())) {
          skippedEmails.push(row.email);
          continue;
        }

        const matchedBatchId = row.batchName ? batchMap.get(row.batchName.toLowerCase().trim()) : null;

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name: row.fullName,
              email: row.email.toLowerCase().trim(),
              phone: row.phone || null,
              passwordHash: defaultPasswordHash,
              role: 'STUDENT',
              status: 'ACTIVE',
            },
          });

          await tx.studentProfile.create({
            data: {
              userId: user.id,
              college: row.college,
              department: row.department,
              graduationYear: row.graduationYear,
              domain: row.domain,
              batchId: matchedBatchId || null,
            },
          });

          // Dispatch notification
          await dispatchNotification({
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            title: 'Welcome to IVR Enterprise Internship Platform',
            message: `Your student portal account has been provisioned.<br><br><strong>Login Email:</strong> ${user.email}<br><strong>Default Password:</strong> Student@IVR2026!<br><br>Access your portal to view your learning roadmap and batch assignments.`,
            type: 'SUCCESS',
            actionUrl: 'http://localhost:3000/login',
            channels: ['EMAIL'],
          });
        });

        existingEmailSet.add(row.email.toLowerCase().trim());
        importedCount++;
      }

      await logAuditEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        userRole: 'ADMIN',
        action: 'EXCEL_BULK_IMPORT',
        module: 'STUDENT_MANAGEMENT',
        details: `Bulk imported ${importedCount} students via Excel. Skipped ${skippedEmails.length} duplicates.`,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedCount} student accounts.`,
        importedCount,
        skippedCount: skippedEmails.length,
        skippedEmails,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Excel import error:', error);
    return NextResponse.json({ error: 'Failed to process Excel import' }, { status: 500 });
  }
}
