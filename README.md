# Job Portal API

A RESTful API for connecting employers and job seekers with role-based access control, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access/refresh tokens
  - Role-based access control (Job Seeker, Employer, Recruiter, Admin)
  - Secure password hashing with bcrypt

- **User Management**
  - User registration (role forced to `job_seeker` by default)
  - Login with JWT token generation
  - Profile management

- **Database**
  - MongoDB Atlas with Mongoose ODM
  - Environment-based configuration
  - Connection pooling and error handling

- **Security**
  - Environment variable validation
  - CORS configuration
  - Rate limiting ready
  - Password hashing with salt rounds

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES6 Modules)
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Environment:** dotenv
- **File Uploads:** multer (coming soon)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Anigbata-Joshua/job-portal-api.git
cd job-portal-api