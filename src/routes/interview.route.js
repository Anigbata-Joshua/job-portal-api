import express from 'express';
import * as interviewController from '../controllers/interview.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, scheduleInterviewSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/', authenticate, authorize('employer', 'recruiter'), validate(scheduleInterviewSchema), interviewController.scheduleInterview);
router.get('/company', authenticate, authorize('employer', 'recruiter'), interviewController.getCompanyInterviews);
router.patch('/:id/status', authenticate, authorize('employer', 'recruiter'), interviewController.updateInterviewStatus);
router.patch('/:id/feedback', authenticate, authorize('employer', 'recruiter'), interviewController.submitFeedback);

router.get('/my', authenticate, authorize('job_seeker'), interviewController.getMyInterviews);

export default router;