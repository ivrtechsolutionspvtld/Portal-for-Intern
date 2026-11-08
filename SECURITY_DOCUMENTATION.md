# Security Documentation: IVR Tech Solutions Portal

This document details the security architecture, cryptographic safeguards, role-based controls, and regulatory compliance standards implemented in the IVR Tech Solutions Platform.

---

## 1. Cryptographic Security & Password Hashing

### Adaptive Salted Password Hashing:
* **Algorithm:** Bcrypt (`bcryptjs`) with cost factor (salt rounds) of `10`.
* **Zero Plaintext Exposure:** Passwords are never stored in plain text, logged, or serialized into JSON API responses.
* **Resistance to Attacks:** Each password hash includes a cryptographically randomized 128-bit salt, making precomputed dictionary and rainbow-table attacks computationally impossible.

---

## 2. Authentication & Session Management

### Stateless JSON Web Tokens (JWT):
* **Signing Algorithm:** HMAC SHA-256 (`HS256`) signed with a high-entropy secret (`JWT_SECRET`).
* **Storage Standard:** Tokens are transmitted exclusively inside an HTTP-only cookie (`ivr_auth_token`):
  * **`HttpOnly: true`**: JavaScript running in the browser cannot read or extract the session cookie, eliminating Cross-Site Scripting (XSS) credential theft.
  * **`SameSite: Lax`**: Restricts browser cross-site cookie transmission, preventing Cross-Site Request Forgery (CSRF).
  * **`Secure: true` (in production)**: Ensures cookies are only transmitted over TLS/HTTPS encrypted channels.
  * **`Expires: 7 Days`**: Sessions automatically expire and require re-authentication.

---

## 3. Role-Based Access Control (RBAC) & Gatekeeper Protection

```
┌─────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│ Incoming Request│ ───►  │ JWT Signature Verify │ ───►  │ Account Status Check │
└─────────────────┘       └──────────────────────┘       └──────────┬───────────┘
                                                                    │
                    ┌───────────────────────────────────────────────┴─────────────────┐
                    ▼                                                                 ▼
         ┌─────────────────────┐                                           ┌─────────────────────┐
         │ Status == 'ACTIVE'  │                                           │ Status != 'ACTIVE'  │
         └──────────┬──────────┘                                           └──────────┬──────────┘
                    │                                                                 │
                    ▼                                                                 ▼
         ┌─────────────────────┐                                           ┌─────────────────────┐
         │ Verify Target Role  │                                           │ Return HTTP 403     │
         │ (ADMIN/MENTOR/STU)  │                                           │ "Account Pending/   │
         └──────────┬──────────┘                                           │  Deactivated"       │
                    │                                                      └─────────────────────┘
                    ▼
         ┌─────────────────────┐
         │ Grant Access & Log  │
         │ Audit Telemetry     │
         └─────────────────────┘
```

### Backend Enforcement:
* Access controls are enforced strictly on the server in every API route handler (`src/app/api/...`), not merely on the client UI.
* **Account Status Gatekeeper:** Even if a user knows their correct password, if their `status` is `PENDING_APPROVAL`, `REJECTED`, or `DEACTIVATED`, the API immediately rejects the request with HTTP `403 Forbidden`.
* **Student/Mentor Self-Approval Block:** The approvals endpoint (`/api/admin/approvals`) enforces that only users with the `ADMIN` role can alter status, and rejects any attempt by an actor to self-approve.

---

## 4. Database Security & Injection Prevention

* **Parameterized SQL Queries:** The application uses Prisma ORM for all database transactions. Prisma compiles all queries using parameterized statements. User inputs are never concatenated directly into raw SQL strings, completely neutralizing SQL Injection (SQLi) vulnerabilities.
* **Foreign Key Constraints:** Cascade deletions are configured safely (`onDelete: Cascade` on profiles, `onDelete: SetNull` on audit logs) ensuring referential integrity without orphan records.

---

## 5. Audit Logging & Security Telemetry

Every security-sensitive operation creates an immutable entry in the `AuditLog` table:
* **Captured Attributes:** Timestamp, Actor User ID, Actor Email, Actor Role, Event Action, Module, Details, and Client IP Address.
* **Tracked Events:**
  * User authentication & logins
  * Student & Mentor self-registration submissions
  * Account approvals, rejections, and deactivations
  * Manual student provisioning and deletions
  * Mentor allocations and student assignments
  * Attendance session generation & manual adjustments
  * Project grading, score updates, and certificate revocations
  * Platform settings and fee schedule changes

---

## 6. Digital Personal Data Protection (DPDP) Act Compliance

The platform is designed in accordance with India's Digital Personal Data Protection (DPDP) Act:
1. **Data Minimization:** Only minimal personal data necessary for collegiate evaluation and accreditation is requested.
2. **Data Residency:** All production infrastructure (ECS, RDS, S3) resides within the territory of India in **AWS Mumbai (`ap-south-1`)**.
3. **Redaction on Verification:** Public verification pages (`/verify/[certificateNumber]`) display only the candidate's name, domain, and completion date. Personal phone numbers, physical addresses, and college grades are never exposed to public search crawlers.
4. **Right to Erasure:** Administrators possess tools to delete applicant records and audit logs upon legitimate request once statutory recordkeeping periods conclude.

