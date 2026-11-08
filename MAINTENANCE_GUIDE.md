# Maintenance & Engineering Guide: IVR Tech Solutions Portal

This technical guide provides future maintainers and software engineers with clear instructions on how to add features, modify dashboard interfaces, evolve the Prisma schema, troubleshoot production errors, and scale the platform as student enrollment grows.

---

## 1. Adding New Features & Dashboard Pages

### A. Creating a New Admin Section:
1. **Create the page route:** Add a new file at `src/app/admin/<feature>/page.tsx`.
2. **Wrap with DashboardLayout:**
   ```tsx
   import DashboardLayout from '@/components/layout/DashboardLayout';
   
   export default function NewAdminFeaturePage() {
     return (
       <DashboardLayout role="ADMIN">
         <div>... feature content ...</div>
       </DashboardLayout>
     );
   }
   ```
3. **Add Navigation Entry:** Open `src/components/layout/DashboardLayout.tsx` and add your route to `adminNav`:
   ```typescript
   { label: 'New Feature', href: '/admin/new-feature', icon: Sparkles }
   ```

### B. Creating a Secure API Route Handler:
Create `src/app/api/admin/<feature>/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Execute database operations
  const records = await prisma.batch.findMany();
  return NextResponse.json({ success: true, records });
}
```

---

## 2. Evolving the Database Schema

When adding new columns, relationships, or tables:

1. **Edit Schema Definition:** Open `prisma/schema.prisma` and add your fields:
   ```prisma
   model StudentProfile {
     // ... existing fields ...
     linkedinProfile String?
   }
   ```
2. **Push Schema to Database (Development):**
   ```bash
   npx prisma db push
   ```
3. **Regenerate Type-Safe Client:**
   ```bash
   npx prisma generate
   ```
4. **Production Migration (PostgreSQL):**
   ```bash
   npx prisma migrate dev --name add_linkedin_field
   ```

---

## 3. Dependency Management & Security Patching

Keep packages updated and audit for vulnerabilities quarterly:
```bash
# 1. Audit dependencies for security advisories
npm audit

# 2. Fix non-breaking security patches
npm audit fix

# 3. Check for major version updates
npm outdated
```

---

## 4. Performance Monitoring & Diagnostics

### A. Health Check Endpoint:
The application provides a health check route at `/api/health` returning database latency and server uptime for AWS Application Load Balancer target groups.

### B. CloudWatch Metrics to Monitor:
1. **ECS CPU Utilization:** If sustained > 75%, increase task count or allocate 1.0 vCPU.
2. **ECS Memory Utilization:** Monitor for memory leaks (normal range: 250MB - 450MB per pod).
3. **ALB 5XX Error Rate:** Set an alarm if HTTP 500 errors exceed 1% over a 5-minute window.
4. **RDS Database Storage:** Monitor free storage space; configure auto-scaling storage up to 100GB.

---

## 5. Scaling Architecture for High-Volume Enrollment

When cohort enrollment scales beyond 1,000 active students:

```
                  ┌───────────────────────────────┐
                  │    High-Traffic Enrollment    │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│     Compute Scaling (ECS)       │        │     Database Scaling (RDS)      │
├─────────────────────────────────┤        ├─────────────────────────────────┤
│ • Auto-scaling policy (2-10 pods│        │ • Prisma connection pooling     │
│ • CloudWatch CPU target 70%     │        │ • RDS Read Replicas             │
│ • Container memory 2048 MB      │        │ • S3 Presigned direct uploads   │
└─────────────────────────────────┘        └─────────────────────────────────┘
```

1. **Prisma Connection Pooling:**
   * In multi-pod deployments, configure Prisma connection pool limits using `DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"`.
2. **Direct-to-S3 File Uploads:**
   * For resumes and assignment ZIP files larger than 10MB, generate AWS S3 presigned URLs so students upload files directly to Amazon S3 rather than routing through the Next.js web tier.
3. **Horizontal Pod Auto-Scaling:**
   * In `deploy/terraform-main.tf`, uncomment the `aws_appautoscaling_target` block to automatically scale ECS tasks between 2 and 10 pods during registration surges.

