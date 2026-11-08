# Administrator Operations Guide: IVR Tech Solutions Portal

This operational handbook guides platform owners and administrators through daily system management, account approvals, student/mentor workflows, data exports, and emergency procedures.

---

## 1. Accessing the Administrator Portal

1. Open your web browser and navigate to:  
   **`http://localhost:3000/login`** (or your live production domain).
2. Enter your authorized administrator email and password:
   * **Primary Admin Email:** `admin@ivrtechsolution.in`
   * **Fast-Fill Utility:** On the login page, click **"Fill Admin"** to automatically populate credentials for quick access.
3. Upon successful authentication, you will be redirected to the **Main Operations Console** at **`/admin`**.

---

## 2. Managing Account Approvals (`/admin/approvals`)

The platform implements a strict gatekeeper approval workflow. When candidates register through `/register`, their account status is set to **`PENDING_APPROVAL`**.

### How to Approve an Account:
1. Open the sidebar and click **Account Approvals** (`/admin/approvals`).
2. Review the **Pending Students** or **Pending Mentors** tab.
3. Click the **Eye icon** to view full application details (degree, college, roll number, resume URL).
4. Click **Approve**:
   * Optionally select an initial faculty mentor from the dropdown.
   * Add any internal review remarks.
   * Confirm approval. The system updates their status to `ACTIVE`, creates an audit log entry, and dispatches an official activation email to the applicant.

### How to Reject or Request Information:
* **Reject:** Click **Reject**, enter the specific rationale in the required text box, and submit. The applicant's status updates to `REJECTED`, preventing portal access.
* **Request Information:** Click **Request Info**, specify what documents or clarifications are needed, and submit. Status transitions to `INFO_REQUESTED`.
* **Deactivate an Active Account:** In the **Approved Accounts** tab, click **Deactivate** on any user to instantly revoke their portal login access.

---

## 3. Student Management & Mentorship Allocation (`/admin/students`)

* **Adding a Student Manually:** Click **"Add Student"**, fill in the candidate's academic details (Name, Email, College, Department, Degree, Academic Year, Domain, Batch, and Mentor), and submit.
* **Assigning / Reassigning a Mentor:** In the students table, click the **Edit icon** (Pencil) next to the student, choose the new faculty mentor from the dropdown, and save.
* **Deleting a Student Account:** Click the **Trash icon** next to the student. A confirmation dialog will prompt you to confirm permanent deletion. Deleting a student cascades and cleans up associated profiles safely.
* **Bulk Import via Excel:** Click **"Excel Bulk Import"**, upload your `.xlsx` spreadsheet matching the standard columns, preview the parsed rows, and click **Commit Import**.
* **Exporting Student Roster:** Click **"Export Roster (Excel)"** to immediately download a formatted `.xlsx` spreadsheet of all fellows.

---

## 4. Mentor Faculty Operations (`/admin/mentors`)

* **Adding a Mentor:** Click **"Provision Faculty Mentor"**, specify their Full Name, Professional Email, Designation, Department, Area of Expertise, Experience, and Student Capacity (default: 30).
* **Workload Monitoring:** Each mentor card displays real-time capacity percentages based on genuinely assigned students.
* **Exporting Mentor Directory:** Click **"Export Mentors (Excel)"** in the header to download the complete faculty roster.

---

## 5. System Configuration & Mandatory Fields (`/admin/settings`)

Administrators have control over which student fields are mandatory during registration:
1. Navigate to **System Settings** (`/admin/settings`).
2. Under **Mandatory Student Registration Fields**, check or uncheck fields (e.g. Phone, College, Department, Degree, Academic Year, Graduation Year, Registration Number, Resume).
3. Configure minimum attendance thresholds (default: 80%) and capstone score criteria (default: 70%) required for certificate issuance.
4. Click **Save Configuration Settings**. Changes take effect immediately across all registration endpoints.

---

## 6. How to Add Another Administrator Securely

For security and compliance with enterprise separation-of-duties principles, new administrators should be created directly via programmatic database seeding or via the database CLI:

```bash
# Generate password hash using Node.js
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('NewAdminPassword@2026!', 10).then(console.log)"
```

Then insert the new admin record into Prisma:
```typescript
await prisma.user.create({
  data: {
    email: 'new.admin@ivrtechsolution.in',
    passwordHash: '<generated-bcrypt-hash>',
    name: 'Executive Operations Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
});
```

---

## 7. How to Reset an Administrator Password

If an administrator password is forgotten:
1. Open PowerShell or Terminal in the project root.
2. Run the secure reset script:
   ```bash
   npx jiti prisma/seed.ts
   ```
   *(This restores the default administrator password to `Admin@IVR2026!` while preserving database schema integrity).*

---

## 8. Database Backup and Emergency Procedures

* **Immediate File Backup (SQLite):**
  ```powershell
  # Copy database file with timestamp
  Copy-Item prisma/dev.db -Destination "prisma/backup_dev_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
  ```
* **Restore from Backup:**
  ```powershell
  Copy-Item "prisma/backup_dev_TIMESTAMP.db" -Destination prisma/dev.db
  ```
* For production PostgreSQL backup and recovery scripts, refer to `BACKUP_AND_RECOVERY.md`.

