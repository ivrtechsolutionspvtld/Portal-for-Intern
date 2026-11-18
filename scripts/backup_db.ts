import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function backup() {
  console.log('🔄 Starting full database backup...');
  try {
    const backupData: Record<string, any> = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // Export each table
    backupData.tables.users = await prisma.user.findMany({
      include: {
        studentProfile: true,
        mentorProfile: true,
      }
    });
    console.log(`✔ Backed up ${backupData.tables.users.length} users`);

    backupData.tables.courses = await prisma.course.findMany({
      include: { modules: true }
    });
    console.log(`✔ Backed up ${backupData.tables.courses.length} courses`);

    backupData.tables.batches = await prisma.batch.findMany();
    console.log(`✔ Backed up ${backupData.tables.batches.length} batches`);

    backupData.tables.systemSettings = await prisma.systemSettings.findMany();
    console.log(`✔ Backed up ${backupData.tables.systemSettings.length} system settings`);

    backupData.tables.attendanceRecords = await prisma.attendanceRecord.findMany();
    console.log(`✔ Backed up ${backupData.tables.attendanceRecords.length} attendance records`);

    backupData.tables.auditLogs = await prisma.auditLog.findMany();
    console.log(`✔ Backed up ${backupData.tables.auditLogs.length} audit logs`);

    backupData.tables.notifications = await prisma.notification.findMany();
    console.log(`✔ Backed up ${backupData.tables.notifications.length} notifications`);

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `db_backup_${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log(`\n✅ Backup successfully saved to: ${filepath}`);
    console.log('--- Current Genuine Users in DB ---');
    for (const u of backupData.tables.users) {
      console.log(`- ${u.name} (${u.email}) [${u.role}] - Status: ${u.status}`);
    }
  } catch (err) {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backup();

