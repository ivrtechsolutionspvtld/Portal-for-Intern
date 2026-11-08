# Project Overview: IVR Tech Solutions Internship Platform

**Platform Name:** IVR Tech Solutions Private Limited - Enterprise Internship Portal  
**Organization:** IVR TECH SOLUTIONS PRIVATE LIMITED  
**Core Purpose:** Comprehensive, production-grade management system for collegiate internships, faculty mentor allocations, dynamic cryptographic attendance verification, capstone task reviews, and academic credential issuance.

---

## 1. Executive Summary

The **IVR Tech Solutions Internship Platform** is a full-stack, enterprise-grade web application engineered to bridge academia and technology industry standards. It provides three distinct, role-segregated workspaces:

1. **Enterprise Administrator Portal (`/admin`):** Full administrative sovereignty over applicant approvals, student rosters, faculty mentor allocations, engineering cohorts, fee structures, multi-channel broadcast announcements, and audit logging.
2. **Academic Faculty Workspace (`/mentor`):** Dedicated workspace for assigned faculty mentors to monitor student progress, review GitHub capstone repositories, grade deliverables, generate time-limited cryptographic QR codes for class check-ins, and communicate with fellows.
3. **Internship Fellow Dashboard (`/student`):** Personalized student portal for attendance tracking, courseware progress, task submissions, mentor feedback reviews, fee invoices, and verifiable cryptographic certificates.

---

## 2. Core Functional Modules

```
                           ┌─────────────────────────────────────────┐
                           │      IVR TECH SOLUTIONS PRIVATE LTD     │
                           │           Internship Platform           │
                           └────────────────────┬────────────────────┘
                                                │
         ┌──────────────────────────────┬───────┴──────────────────────┬─────────────────────────────┐
         ▼                              ▼                              ▼                             ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐          ┌──────────────────┐
│   Public Site    │           │  Admin Control   │           │  Mentor Portal   │          │  Student Portal  │
├──────────────────┤           ├──────────────────┤           ├──────────────────┤          ├──────────────────┤
│ • Homepage       │           │ • 17 Workspaces  │           │ • Assigned Cohort│          │ • Personal Tasks │
│ • 8 Track Guides │           │ • Gatekeeper Appr│           │ • QR Attendance  │          │ • QR Check-in    │
│ • Self-Register  │           │ • Student Roster │           │ • Code Review    │          │ • LMS Modules    │
│ • QR Certificate │           │ • Mentor Alloc.  │           │ • 1-on-1 Comms   │          │ • Certificates   │
│ • DPDP Privacy   │           │ • Audit Logs     │           │ • Cohort Reports │          │ • Fee Invoices   │
└──────────────────┘           └──────────────────┘           └──────────────────┘          └──────────────────┘
```

### A. Gatekeeper Account Activation & Approval System
No student or mentor gains immediate active portal access upon registration.
* Every self-registration (`/register`) enters a **`PENDING_APPROVAL`** state.
* The Administrator reviews applicant credentials in the dedicated **Account Approval Management** console (`/admin/approvals`).
* Admins can **Approve** (activates account and sends welcome email), **Reject** (with reason), **Request Additional Information**, or **Deactivate/Reactivate** existing accounts.
* Backend route guards strictly block non-active accounts from receiving session tokens.

### B. Student Management Module (`/admin/students`)
* Add students manually or import bulk rosters via standardized Excel spreadsheets (`.xlsx`).
* Individual profile inspection showing real-time attendance compliance percentages, capstone submissions, and mentor linkages.
* Instant mentor assignment and re-assignment.
* Search across Student Name, Email, Phone, Student ID (`IVR-STU-YYYY-XXXX`), and University Roll Number.
* One-click data export to encrypted Excel spreadsheets.

### C. Mentor Faculty Module (`/admin/mentors`)
* Provisioning of industry mentors with designated specialization tracks, employee identifiers (`IVR-DEMO-EMP-001`), and seat capacities.
* Real-time mentor workload tracking index.
* Student-to-mentor allocation management.
* Comprehensive Excel exports of the mentor directory.

### D. Cryptographic Attendance & Verification
* Mentors initiate dynamic, time-limited attendance sessions generating cryptographically signed QR tokens valid for 5 minutes.
* Fellows scan the dynamic QR code directly from their student dashboard camera/scanner.
* Tamper-proof public certificate verification portal (`/verify/[certificateNumber]`) with embedded QR verification codes.

### E. Multi-Channel Notification Hub
* Synchronized notice dissemination across In-App notification feeds, Amazon SES transactional emails, and WhatsApp Cloud API payloads.
* Complete security audit logging capturing administrator actions, login timestamps, and IP addresses.

---

## 3. High-Level Architecture Directory Layout

* **`src/app/`**: Next.js App Router containing route pages and API endpoints.
  * **`src/app/admin/`**: 17 dedicated enterprise administrative sections.
  * **`src/app/mentor/`**: Academic mentor workspaces.
  * **`src/app/student/`**: Internship fellow portals.
  * **`src/app/api/`**: Secure serverless route handlers enforcing RBAC.
  * **`src/app/register/`**: Multi-role self-registration onboarding.
  * **`src/app/login/`**: Unified authentication with credential presets.
  * **`src/app/verify/`**: Public cryptographic credential verification.
* **`src/components/`**: Reusable UI components styled in modern enterprise purple.
* **`src/lib/`**: Authentication helpers (`auth.ts`), Prisma client (`prisma.ts`), Excel parser (`excel.ts`), QR generator (`qr.ts`), and notification dispatchers (`notifications.ts`).
* **`prisma/`**: Database schema definition (`schema.prisma`) and seed orchestrator (`seed.ts`).
* **`deploy/`**: AWS ECS Fargate task definitions and Terraform cloud infrastructure templates.

---

## 4. Demonstration Accounts

To evaluate and verify complete portal workflows without creating fabricated public profiles, two designated demo accounts are maintained in the database:

1. **Demonstration Student:**
   * **Name:** Rahul Kumar
   * **Student ID:** `IVR-DEMO-STU-001`
   * **Email:** `rahul.demo@ivrtechsolution.in`
   * **Track:** Full Stack Development
   * **Assigned Mentor:** Arjun Sharma
2. **Demonstration Mentor:**
   * **Name:** Arjun Sharma
   * **Mentor ID:** `IVR-DEMO-MEN-001`
   * **Employee ID:** `IVR-DEMO-EMP-001`
   * **Designation:** Technical Mentor
   * **Specialization:** Full Stack Development

