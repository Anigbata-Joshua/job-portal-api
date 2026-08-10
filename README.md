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
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/job_portal
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
NODE_ENV=development
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

### Authentication
- `POST /api/auth/register` - Create Seeker/Employer profile
- `POST /api/auth/login` - Authenticate & receive HttpOnly cookies
- `POST /api/reports/seeker` - Analytics for Job Seeker (Seeker role)
- `POST /api/reports/employer` - Analytics for Company (Employer/Recruiter roles)
- `POST /api/reports/admin` - Platform-wide stats (Admin role)
- `POST /api/auth/refresh` - Rotate tokens
- `POST /api/auth/logout` - Clear active session tokens

### Job Management
- `POST /api/jobs` - Post a new job (Employer/Recruiter)
- `GET /api/jobs` - Public job listing feed with queries
- `GET /api/jobs/:id` - Public job detail retrieval
- `PATCH /api/jobs/:id` - Edit listing (Owner only)

### Applications & Interviews
- `POST /api/applications` - Seeker applies for a job
- `POST /api/interviews` - Schedule interview with double-booking checks
- `PATCH /api/saved-jobs` - Save listing to candidate dashboard