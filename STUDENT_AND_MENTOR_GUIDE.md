# Student & Mentor User Guide: IVR Tech Solutions Portal

This comprehensive operational guide details step-by-step procedures for Internship Fellows (Students) and Academic Faculty Mentors using the IVR Tech Solutions Portal.

---

## Part 1: Student Fellow Guide

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STUDENT FELLOW LIFECYCLE                           │
├───────────────┬─────────────────┬───────────────────┬───────────────────┤
│ 1. Register   │ 2. Gatekeeper   │ 3. Fellowship     │ 4. Certification  │
│ Submit details│ Await Admin     │ Daily attendance, │ Milestone score   │
│ & credentials │ Verification    │ tasks, & reviews  │ & QR verification │
└───────────────┴─────────────────┴───────────────────┴───────────────────┘
```

### 1. Registration & Account Activation
1. Visit the portal registration page: **`http://localhost:3000/register`**.
2. Select the **Student Fellowship** tab.
3. Fill in your academic dossier:
   * **Full Name, Email Address, Contact Phone Number**
   * **College / University, Department, Degree (e.g. B.Tech), Academic Year (e.g. Final Year), Graduation Year**
   * **University Roll Number / Student Registration Number**
   * **Internship Program Track** (choose from the 8 specialized tracks, e.g. *Full-Stack Web Development*, *Cloud Computing & DevOps*, *AI/ML*)
   * **Resume / Cloud Portfolio Link** (Google Drive, GitHub, or LinkedIn)
   * **Account Password** (minimum 8 characters)
4. Submit the registration form.
5. Your registration is assigned a unique identifier (e.g., `IVR-STU-2026-XXXX`) with status **`PENDING_APPROVAL`**.
6. Once an administrator verifies and activates your account, you will receive an official activation email confirming that your account is **`ACTIVE`**.

### 2. Logging In to the Student Portal
1. Navigate to **`http://localhost:3000/login`**.
2. Enter your registered email and password.
   * *For evaluation:* Click **"Fill Demo Student (Rahul)"** to instantly test with the pre-approved demo account (`rahul.demo@ivrtechsolution.in` / `StudentDemo@2026!`).
3. Click **Sign In** to access your personal dashboard at **`/student`**.

### 3. Student Dashboard Navigation
* **Overview (`/student`):** View your overall attendance percentage, curriculum progress, assigned faculty mentor, cohort details, and upcoming deadlines.
* **My Profile (`/student/profile`):** Review verified academic information, collegiate affiliations, and update your phone number, bio, and resume links.
* **Learning Resources (`/student/learning`):** Access structured week-by-week curriculum modules, architecture diagrams, and technical documentation.
* **Attendance & QR Check-in (`/student/attendance`):**
  * During lecture sessions, your mentor will present a dynamic cryptographic QR code.
  * Click **"Scan Dynamic QR Attendance"** to check in.
  * The system verifies the token in real-time, logs your check-in, and updates your compliance score.
* **Milestone Projects (`/student/projects`):**
  * View project specifications, architectural rubrics, and deadlines.
  * Submit GitHub repository links and live deployment URLs.
  * Review mentor evaluations, scores (0-100), and detailed feedback.
* **Mentor Messages (`/student/messages`):** Communicate directly with your assigned faculty mentor for 1-on-1 guidance and project support.
* **Bulletins & Notices (`/student/announcements`):** Read official broadcast announcements from IVR administration.
* **Fees & Invoices (`/student/payments`):** View fee schedules, receipt numbers, and Razorpay checkout orders.
* **Certificate & QR (`/student/certificate`):** Upon achieving >=80% attendance and completing capstone milestones, view and download your cryptographically verified certificate.

---

## Part 2: Faculty Mentor Guide

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FACULTY MENTOR WORKFLOW                           │
├─────────────────┬───────────────────┬───────────────────┬───────────────┤
│ 1. Onboarding   │ 2. Cohort QR      │ 3. Code Review    │ 4. Evaluation │
│ Admin verified  │ Launch dynamic    │ Review GitHub repo│ Score rubrics │
│ credentials     │ 5-min QR session  │ & live deployment │ & submit grade│
└─────────────────┴───────────────────┴───────────────────┴───────────────┘
```

### 1. Mentor Onboarding & Login
1. Mentors can self-register at **`/register`** (under the **Academic Mentor** tab) or be directly provisioned by an administrator.
2. Enter your credentials at **`/login`**:
   * *For evaluation:* Click **"Fill Demo Mentor (Arjun)"** to log in as the demonstration mentor (`arjun.demo@ivrtechsolution.in` / `MentorDemo@2026!`).
3. You will be routed to your workspace at **`/mentor`**.

### 2. Mentor Workspace Features
* **Mentor Overview (`/mentor`):** Displays your total assigned students, active cohorts, pending deliverable reviews, and average cohort attendance.
* **Mentor Profile (`/mentor/profile`):** View your unique Mentor ID (`IVR-DEMO-MEN-001`), Employee ID (`IVR-DEMO-EMP-001`), designation, department, and student capacity index.
* **Assigned Students (`/mentor/students`):** Complete roster of students assigned to your guidance. Inspect their attendance records, submitted projects, and contact emails.
* **Attendance & Dynamic QR (`/mentor/attendance`):**
  * Click **"Generate Dynamic Attendance QR"** to initiate a 5-minute session.
  * Display the generated QR matrix on screen for fellows to scan.
  * View real-time live check-ins as students record attendance.
* **Assignments & Reviews (`/mentor/projects`):**
  * View all capstone milestone submissions from assigned fellows.
  * Click **GitHub** to inspect candidate repository code, commit history, and test coverage.
  * Click **"Grade Deliverable"** to input numerical rubric scores (0-100) and structured constructive feedback.
  * Approved milestones immediately update the student's graduation readiness index.
* **Student Communication (`/mentor/messages`):** Chat directly with your assigned fellows to answer architectural questions and schedule review sessions.
* **Cohort Reports (`/mentor/reports`):** Export and inspect comprehensive performance summaries for your assigned cohorts.

