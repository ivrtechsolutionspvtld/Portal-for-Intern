# Backup & Disaster Recovery Guide: IVR Tech Solutions Portal

This operational runbook provides clear, step-by-step instructions for executing database backups, establishing automated recovery points, and restoring the IVR Tech Solutions Platform in the event of hardware failure, data corruption, or accidental deletion.

---

## 1. Recovery Objectives

* **Recovery Point Objective (RPO):** Maximum acceptable data loss interval is **1 hour** (achieved via automated AWS RDS snapshot logs or hourly cron backups).
* **Recovery Time Objective (RTO):** System restoration time target is under **30 minutes**.

---

## 2. Local / Development Backup Procedures (SQLite)

In local development, the entire database is encapsulated in a single file: `prisma/dev.db`.

### A. Immediate Manual Backup:
Run in PowerShell:
```powershell
# Create an instantaneous timestamped database copy
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "prisma/dev.db" -Destination "prisma/dev_backup_$timestamp.db"
Write-Host "✔ Backup created: prisma/dev_backup_$timestamp.db"
```

### B. Automated Daily Backup Script (Windows Task Scheduler / Cron):
Create a backup script `scripts/backup_db.ps1`:
```powershell
$source = "C:\Users\reddy\OneDrive\Desktop\Internship platform\prisma\dev.db"
$destination = "C:\Users\reddy\OneDrive\Desktop\Internship platform\backups"
if (!(Test-Path $destination)) { New-Item -ItemType Directory -Path $destination }

$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Copy-Item $source -Destination "$destination\dev_db_$date.db"

# Retain backups for 30 days and purge older files
Get-ChildItem $destination -Filter "*.db" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

### C. Restoring from SQLite Backup:
1. Stop the application server:
   ```bash
   # Terminate running dev server process
   Get-Process -Name node | Stop-Process
   ```
2. Replace `prisma/dev.db` with your selected backup:
   ```powershell
   Copy-Item "backups/dev_db_2026-11-07_12-00-00.db" -Destination "prisma/dev.db" -Force
   ```
3. Restart the server:
   ```bash
   npm run dev
   ```

---

## 3. Production Backup Procedures (AWS RDS PostgreSQL)

In production on AWS Mumbai (`ap-south-1`), backups are managed automatically:

### A. Automated Point-in-Time Recovery (PITR):
* **Automated Daily Snapshots:** Amazon RDS captures daily storage snapshots retained for 35 days.
* **Transaction Log Archival:** Write-Ahead Logs (WAL) are copied to Amazon S3 every 5 minutes, allowing you to restore the database to any specific minute within the retention period.

### B. Manual On-Demand AWS Snapshot:
Before executing major application updates or migrations:
```bash
aws rds create-db-snapshot \
    --db-instance-identifier ivr-postgres-production \
    --db-snapshot-identifier ivr-pre-update-$(date +%Y%m%d%H%M) \
    --region ap-south-1
```

### C. Logical pg_dump Backup (SQL File Export):
```bash
# Export compressed binary database dump
pg_dump -h <RDS_ENDPOINT> -U ivr_admin -d ivrenterprise -F c -b -v -f "ivr_backup_$(date +%Y%m%d).dump"
```

---

## 4. Production Disaster Recovery Workflow

If the production database experiences catastrophic failure:

1. **Restore to a New RDS Instance from Snapshot:**
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
       --db-instance-identifier ivr-postgres-restored \
       --db-snapshot-identifier ivr-pre-update-20261107 \
       --db-instance-class db.t4g.micro \
       --region ap-south-1
   ```
2. **Update Application Connection String:**  
   Update `DATABASE_URL` in AWS Systems Manager Parameter Store to point to `ivr-postgres-restored`.
3. **Trigger Rolling Deployment:**  
   Reboot the ECS Fargate service to immediately connect all container pods to the restored database.

---

## 5. Routine Backup Verification Drills

* Backups are only as reliable as their last successful restoration test.
* Every 90 days, administrators should restore the latest snapshot to an isolated staging environment and execute `tests/test_portal_workflow.ts` to verify data integrity and login functionality.

