import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import errorHandler from './middleware/error.middleware.js';
import adminRoutes from './routes/admin.route.js';
import authRoutes from './routes/auth.route.js';
import companyRoutes from './routes/company.route.js';
import jobRoutes from './routes/job.route.js';
import resumeRoutes from './routes/resume.route.js';
import jobApplicationRoutes from './routes/jobApplication.route.js';
import interviewRoutes from './routes/interview.route.js';
import savedJobRoutes from './routes/savedJob.route.js';
import notificationRoutes from './routes/notification.route.js';
import reportRoutes from './routes/report.route.js';
import { sanitizeBody } from './utils/sanitize.js';

const app = express();

// Security & core middleware
app.use(helmet());
app.use(cors({
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : env.frontendURI,
    credentials: true,
}));

// Health check — placed BEFORE rate limiters so monitoring/uptime pings
// can never be blocked by rate limiting, regardless of frequency.
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Job Portal API is running!',
        environment: env.nodeEnv,
        isProduction: env.isProduction,
    });
});

// General rate limiter — applies broadly across the whole API
const generalLimiter = rateLimit({
    windowMs: env.rateLimit,
    max: env.generalRateLimitMax,
});
app.use('/api', generalLimiter);

// Stricter rate limiter on authentication routes specifically
const authLimiter = rateLimit({
    windowMs: env.rateLimit,
    max: env.rateLimitMax,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

app.use(express.json());
app.use(sanitizeBody);

// 📍 API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', jobApplicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler); // must be last

export default app;