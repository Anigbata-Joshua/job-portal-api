import express from 'express';
import { createResume, getMyResumes, setDefaultResume, deleteResume } from '../controllers/resume.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { validate, createResumeSchema } from '../middleware/validation.middleware.js';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const router = express.Router();

const resumeUploadLimiter = rateLimit({
    windowMs: env.rateLimit,
    max: 10,
})

router.post('/', authenticate, authorize('job_seeker'), resumeUploadLimiter, upload.single('resume'), validate(createResumeSchema), createResume);
router.get('/my', authenticate, authorize('job_seeker'), getMyResumes);
router.patch('/:id/default', authenticate, authorize('job_seeker'), setDefaultResume);
router.delete('/:id', authenticate, authorize('job_seeker'), deleteResume);

export default router;