# Job Portal API

A secure, production-grade RESTful API for connecting employers and job seekers, featuring strict Role-Based Access Control (RBAC), structured application workflows, transactional integrity, and robust security defenses. Built with Node.js, Express, and MongoDB.

---

## 🚀 Key Features & Remediations

### 🔒 Core Security & Middleware
- **Security Headers (Helmet)**: Configured using `helmet` globally to shield HTTP response headers against clickjacking, script execution, and standard sniffing vectors.
- **Brute-Force Protection**: Rate limiting enabled via `express-rate-limit` on authentication endpoints.
- **Process & Connection Safety**: Registered listeners for `uncaughtException` and `unhandledRejection` to close database connections gracefully on unexpected shutdown.

### 🛡️ Request Validation & Sanitization
- **Strict Input Validation**: Route-level schemas declared via **Zod** to validate registration, logins, job creation, companies, and interviews before hitting controller logic.
- **Stored XSS Sanitization**: Recursive `xss` body sanitization middleware strips malicious scripts and raw HTML tags from rich-text entries like job descriptions.

### 🔑 Authentication & Token Management
- **HttpOnly Cookie Scope**: Delivers Access and Refresh tokens within `HttpOnly`, `Secure`, and `SameSite=Strict` cookies, preventing token extraction via client-side JavaScript.
- **Refresh Token Rotation (RTR)**: Implements token rotation on every renewal. If token reuse is detected, all active sessions for the user are immediately revoked in the database to block hijacked sessions.
- **Enhanced Passwords**: Schema-level custom validators require passwords to contain uppercase letters, numbers, and special symbols.

### 🏛️ Business Logic & Transactional Integrity
- **Transactional Interview Setup**: Interview scheduling is wrapped inside MongoDB transactions (`startSession`), ensuring state transitions and interview records are committed atomically.
- **Double-Booking Prevention**: Checks scheduling intervals to block conflicts for both the candidate and selected interviewers in the same time frame.
- **Active Job Verification**: Restricts job saves and applications exclusively to listings marked with `open` status.
- **Atomic Counter Operations**: Replaced dirty-read increments with Mongoose `$inc` operators to protect against race conditions on applicant counters.

### 📊 Reporting & Analytics
- **Job Seeker Analytics**: Aggregates total applications, status breakdowns, saved jobs, and upcoming interviews.
- **Employer Analytics**: Displays active job statistics, total applications breakdown, and scheduled recruiter interviews.
- **Platform-wide Admin Analytics**: Tracks system users by role, verified vs pending companies, job post statuses, and total application metrics.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES6 Modules)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Validation:** Zod
- **Testing Suite:** Vitest
- **Security:** Helmet, express-rate-limit, xss, bcrypt, jsonwebtoken

---

## 📋 Directory Structure

```text
├── src/
│   ├── config/             # DB & Environment configs
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Auth, Upload, Validation, and Security guards
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints routers
│   ├── utils/              # Handlers, sanitizers, and notifications
│   └── server.js           # Server bootloader & global middlewares
├── tests/                  # Automated Vitest unit & vulnerability tests
├── system_design_review.pdf # System design audit report
├── system_remediation_report.pdf # Before vs After comparative report
└── job_portal_api.postman_collection.json # Importing Postman Collection
```

---

## 🚀 Getting Started

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/Anigbata-Joshua/job-portal-api.git
cd job-portal-api
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/job_portal
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
NODE_ENV=development

# Also required by env.js — worth adding these too, since they're
# not optional (Cloudinary uses required() as well):
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 🧪 Testing

The API uses **Vitest** for unit testing, covering RBAC logic, mimetype spoof filters, concurrency race updates, token rotation, and report metrics.

To execute the test suite:
```bash
npm run test
```

---

## 📂 API Endpoint Routes

### 🔑 Authentication (`/api/auth`)
- `POST /api/auth/register` - Create Seeker or Employer profile.
- `POST /api/auth/login` - Authenticate, log in & receive HttpOnly cookies.
- `POST /api/auth/refresh` - Rotate access/refresh tokens securely.
- `POST /api/auth/logout` - Invalidate tokens & clear active cookies.

### 🏢 Company Profiles (`/api/companies`)
- `POST /api/companies` - Register a new company profile (upgrades candidate to Employer).
- `GET /api/companies/:id` - Fetch public company profile information.
- `PATCH /api/companies/:id` - Update company details (owner check).
- `POST /api/companies/:id/recruiters` - Associate a new Recruiter/Employer to the company.

### 💼 Job Management (`/api/jobs`)
- `POST /api/jobs` - Post a new job (Employer/Recruiter only).
- `GET /api/jobs` - Search and query job listings feed (public).
- `GET /api/jobs/:id` - Retrieve details of a single job post.
- `PATCH /api/jobs/:id` - Edit listing details (owner only).
- `DELETE /api/jobs/:id` - Remove a job listing (owner only).

### 📝 Job Applications (`/api/applications`)
- `POST /api/applications` - Apply to an open job listing (Job Seeker only).
- `GET /api/applications/my` - Fetch candidate's own application history (Job Seeker only).
- `PATCH /api/applications/:id/withdraw` - Withdraw a job application (Job Seeker only).
- `GET /api/applications/job/:jobId` - Fetch all applications for a job listing (Employer/Recruiter only).
- `PATCH /api/applications/:id/status` - Update application status (Employer/Recruiter only).

### 🗓️ Interview Scheduling (`/api/interviews`)
- `POST /api/interviews` - Schedule a candidate interview with transactional safety & double-booking checks (Employer/Recruiter only).
- `GET /api/interviews/company` - Fetch company's scheduled interviews (Employer/Recruiter only).
- `GET /api/interviews/my` - Fetch candidate's scheduled interviews (Job Seeker only).
- `PATCH /api/interviews/:id/status` - Update interview schedule status (Employer/Recruiter only).
- `PATCH /api/interviews/:id/feedback` - Submit/log recruiter feedback and scores (Employer/Recruiter only).

### 🔖 Saved Jobs (`/api/saved-jobs`)
- `POST /api/saved-jobs` - Save a job listing to candidate bookmarks (Job Seeker only).
- `GET /api/saved-jobs` - Fetch all bookmarked job listings (Job Seeker only).
- `DELETE /api/saved-jobs/:jobId` - Remove job listing from bookmarks (Job Seeker only).

### 📄 Resume Management (`/api/resumes`)
- `POST /api/resumes` - Upload a resume document (Job Seeker only, Cloudinary upload).
- `GET /api/resumes/my` - List all uploaded resumes for the candidate (Job Seeker only).
- `PATCH /api/resumes/:id/default` - Set a primary default resume (Job Seeker only).
- `DELETE /api/resumes/:id` - Remove an uploaded resume (Job Seeker only).

### 🔔 Notifications (`/api/notifications`)
- `GET /api/notifications` - Retrieve list of notifications (Authenticated users).
- `PATCH /api/notifications/:id/read` - Mark a specific notification as read.
- `PATCH /api/notifications/read-all` - Mark all notifications as read.
- `DELETE /api/notifications/:id` - Dismiss/delete a notification.

### 📊 Reports & Analytics (`/api/reports`)
- `GET /api/reports/seeker` - Aggregated metrics for candidates (Job Seeker only).
- `GET /api/reports/employer` - Recruitment pipeline analytics (Employer/Recruiter only).
- `GET /api/reports/admin` - Platform-wide statistics (Admin only).

### 🛡️ Admin Console (`/api/admin`)
- `GET /api/admin/companies/pending` - Fetch pending company verification profiles (Admin only).
- `PATCH /api/admin/companies/:id/verify` - Approve/verify a company profile (Admin only).