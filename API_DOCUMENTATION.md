# API Documentation: IVR Tech Solutions Internship Platform

All API route handlers are implemented using Next.js App Router serverless conventions under `src/app/api/`. Every protected endpoint verifies the HTTP-only `ivr_auth_token` JWT cookie and enforces Role-Based Access Control (RBAC).

---

## 1. Authentication & Onboarding APIs

### `POST /api/auth/login`
Authenticates users and issues session cookies.
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "admin@ivrtechsolution.in",
    "password": "Admin@IVR2026!"
  }
  ```
* **Status Validations:**
  * If `status === 'PENDING_APPROVAL'`: Returns HTTP `403` with notice that account is awaiting administrator review.
  * If `status === 'REJECTED'`: Returns HTTP `403` with rejection reason.
  * If `status === 'DEACTIVATED'`: Returns HTTP `403`.
  * If `status === 'ACTIVE'`: Issues signed JWT cookie (`ivr_auth_token`) with 7-day expiration and returns user profile with redirect URL.

### `POST /api/auth/register`
Self-service onboarding for student fellows and faculty mentors.
* **Access:** Public
* **Request Body (Student):**
  ```json
  {
    "role": "STUDENT",
    "name": "Priya Sharma",
    "email": "priya.student@university.edu.in",
    "phone": "+91 9876543210",
    "college": "National Institute of Technology",
    "department": "Computer Science and Engineering",
    "degree": "B.Tech",
    "academicYear": "Final Year",
    "graduationYear": 2026,
    "regNumber": "22CS0148",
    "domain": "Full-Stack Web Development",
    "resumeUrl": "https://drive.google.com/...",
    "password": "SecurePassword123!"
  }
  ```
* **Response:** Generates unique `IVR-STU-YYYY-XXXX` identifier, sets status to `PENDING_APPROVAL`, dispatches admin notifications, and logs audit record.

### `GET /api/auth/me`
Returns current session payload and expanded profile.
* **Access:** Authenticated (`ADMIN`, `MENTOR`, `STUDENT`)

### `POST /api/auth/logout`
Clears session cookie and invalidates authentication.
* **Access:** Authenticated

---

## 2. Administrator Approval Gatekeeper APIs

### `GET /api/admin/approvals`
Retrieves categorized approval queues.
* **Access:** `ADMIN` only
* **Response Payload:**
  ```json
  {
    "counts": {
      "pendingStudents": 1,
      "pendingMentors": 0,
      "approvedAccounts": 2,
      "rejectedAccounts": 0,
      "deactivatedAccounts": 0
    },
    "pendingStudents": [...],
    "pendingMentors": [...],
    "approvedAccounts": [...]
  }
  ```

### `POST /api/admin/approvals`
Executes approval workflow decisions.
* **Access:** `ADMIN` only
* **Request Body:**
  ```json
  {
    "userId": "uuid-v4",
    "action": "APPROVE", // "APPROVE" | "REJECT" | "REQUEST_INFO" | "DEACTIVATE" | "ACTIVATE"
    "notes": "Verified collegiate affiliation",
    "mentorId": "optional-mentor-profile-id"
  }
  ```
* **Actions:**
  * `APPROVE`: Transitions status to `ACTIVE`, links initial mentor if provided, triggers official activation email.
  * `REJECT`: Transitions status to `REJECTED`, records rejection notes, triggers email notice.
  * `REQUEST_INFO`: Transitions status to `INFO_REQUESTED`, records requested info.
  * `DEACTIVATE` / `ACTIVATE`: Toggles account availability.

---

## 3. Student Management APIs

### `GET /api/admin/students`
* **Access:** `ADMIN` only
* **Query Parameters:** `search`, `domain`, `batchId`, `status`, `department`, `college`
* **Response:** Array of student profiles with calculated attendance percentage, completed projects count, and mentor details.

### `POST /api/admin/students`
Manually provisions a student account.
* **Access:** `ADMIN` only
* **Request Body:** Full student profile fields plus password.

### `GET /api/admin/students/[id]`
Fetches complete student dossier including submissions, attendance history, and certificates.
* **Access:** `ADMIN` only

### `PUT /api/admin/students/[id]`
Updates student fields or reassigns mentor/batch.
* **Access:** `ADMIN` only

### `DELETE /api/admin/students/[id]`
Permanently deletes student profile and associated user account.
* **Access:** `ADMIN` only

### `GET /api/admin/students/export`
Generates and downloads standardized master student roster in Microsoft Excel (`.xlsx`) format.
* **Access:** `ADMIN` only

---

## 4. Mentor Management APIs

### `GET /api/admin/mentors`
Returns all faculty mentors, employee IDs, student counts, and active batch assignments.
* **Access:** `ADMIN` only

### `POST /api/admin/mentors`
Provisions a new faculty mentor account.
* **Access:** `ADMIN` only

### `GET /api/admin/mentors/[id]`
Fetches mentor profile, workload metrics, and assigned student roster.
* **Access:** `ADMIN` only

### `PUT /api/admin/mentors/[id]`
Updates mentor details, capacity, or reassigns students via `assignStudentIds` / `unassignStudentIds`.
* **Access:** `ADMIN` only

### `DELETE /api/admin/mentors/[id]`
Unlinks assigned students and removes mentor profile and account.
* **Access:** `ADMIN` only

### `GET /api/admin/mentors/export`
Downloads complete mentor directory as an Excel spreadsheet.
* **Access:** `ADMIN` only

---

## 5. Attendance & Dynamic QR APIs

### `POST /api/mentor/attendance/session`
Initiates a 5-minute dynamic QR attendance window.
* **Access:** `MENTOR` only
* **Response:** Returns cryptographic session token and expiration timestamp.

### `POST /api/student/attendance`
Fellow check-in by submitting scanned QR token.
* **Access:** `STUDENT` only
* **Validation:** Verifies token matches active batch session and has not expired. Prevents duplicate check-ins on same day.

### `POST /api/admin/attendance`
Administrative manual correction of attendance records.
* **Access:** `ADMIN` only

---

## 6. Public Verification API

### `GET /api/verify/[certNumber]`
Public endpoint verifying authenticity of an issued certificate.
* **Access:** Public (CORS permitted, zero sensitive data exposed)
* **Response:** Student name, domain track, completion date, issuance status (`VALID` or `REVOKED`), and cryptographic seal.

