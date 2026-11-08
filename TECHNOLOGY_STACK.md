# Technology Stack: IVR Tech Solutions Internship Platform

This document explains every programming language, framework, library, and cloud infrastructure component utilized across the IVR Tech Solutions Internship Platform, along with the engineering rationale for each choice.

---

## 1. Stack Summary Table

| Category | Technology | Version | Purpose in Application |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | `16.4.3` | Full-stack React framework with SSR, Turbopack, and API routes |
| **UI Library** | React | `19.3.0` | Declarative component UI engine |
| **Styling Engine** | Tailwind CSS | `4.0` | Utility-first styling with modern enterprise purple theme |
| **Iconography** | Lucide React | `1.16.0` | Scalable vector icons for clean SaaS dashboard interfaces |
| **Programming Language** | TypeScript | `5.x` | Static typing and compile-time contract enforcement |
| **Database ORM** | Prisma Client & CLI | `5.22.0` | Type-safe database queries, schema migrations, and relations |
| **Database Engine** | SQLite (Dev/Local) | `3.x` | Embedded relational SQL database (file: `./dev.db`) |
| **Authentication Engine** | JSON Web Tokens (`jsonwebtoken`) | `9.0.2` | Signed, stateless, HTTP-only session tokens |
| **Password Security** | BcryptJS | `2.4.3` | Adaptive salted one-way password hashing (work factor 10) |
| **Spreadsheet Engine** | XLSX (SheetJS) | `0.18.5` | In-memory binary parsing and generation of `.xlsx` rosters |
| **Cryptographic QR** | QRCode | `1.5.4` | Matrix barcode generation for dynamic attendance and certificates |
| **Containerization** | Docker & Docker Compose | Multi-stage | Alpine Node.js 20 production container images |
| **Cloud Hosting** | AWS ECS Fargate | ap-south-1 | Serverless Docker container cluster in Mumbai |
| **Email Service** | Amazon SES / Transactional Logger | v3 / SMTP | DPDP-compliant automated email dispatches |
| **Payment Gateway** | Razorpay SDK Hooks | API v1 | Indian UPI, NetBanking, and Card checkout orders |

---

## 2. Detailed Architectural Rationale

### A. Next.js 16 with Turbopack & React 19
* **Why Next.js:** Next.js eliminates architectural fragmentation by running both server-rendered web pages and secure serverless backend API endpoints within a single unified TypeScript project.
* **App Router Advantage:** Route segregation (`/admin`, `/mentor`, `/student`) allows customized layout wrappers, isolated session checks, and fast page loads via React Server Components.
* **Turbopack:** High-speed development bundler written in Rust, reducing hot-reload iteration latency to milliseconds.

### B. TypeScript 5
* **Why TypeScript:** Large multi-user platforms require strict data validation. TypeScript guarantees that student profile fields, mentor IDs, and attendance records match the database schema at compile time, eliminating runtime type crashes.

### C. Prisma ORM 5.22
* **Type-Safe Relational Access:** Prisma generates a strongly typed TypeScript client directly from `prisma/schema.prisma`. Every query (`prisma.studentProfile.findUnique(...)`) returns strongly typed objects with autocomplete and automated join handling.
* **Database Agility:** Prisma abstracts database SQL dialects. Switching between local SQLite development and production AWS RDS PostgreSQL requires changing just a single line in `schema.prisma`.

### D. SQLite & PostgreSQL Interoperability
* **Development/Local:** SQLite operates as a single file (`./dev.db`), requiring zero background daemons, external services, or port configuration during development and testing.
* **Production Ready:** Because Prisma is used, the exact same queries and schema seamlessly run against production PostgreSQL (Amazon Aurora / RDS).

### E. JSON Web Tokens (JWT) & BcryptJS
* **Stateless Authentication:** Next.js serverless functions do not require shared server memory to validate user logins. Instead, a cryptographically signed JWT containing user ID, email, and role is stored inside a secure `ivr_auth_token` cookie.
* **Bcrypt Password Security:** Passwords are never stored in plain text. Salted bcrypt rounds prevent dictionary and rainbow-table attacks.

### F. XLSX (SheetJS) & QR Code
* **Native Excel Imports/Exports:** Administrators frequently manage admissions and college reports in Microsoft Excel. The platform directly parses raw `.xlsx` buffers uploaded by administrators and streams downloadable binary spreadsheets without external dependencies.
* **Cryptographic QR Matrix:** Time-sensitive check-in sessions encode unique verification tokens into QR matrices scanned by mobile cameras.

### G. Docker & AWS Mumbai Infrastructure
* **Multi-Stage Dockerfile:** Produces minimal, hardened Alpine Linux containers containing only the compiled Next.js standalone build.
* **AWS ECS Fargate (ap-south-1):** Serverless container hosting in Mumbai ensures sub-30ms network latency across India and statutory compliance with data residency mandates.

