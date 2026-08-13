import express from 'express';
import * as jobApplicationController from '../controllers/jobApplication.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, applyToJobSchema, updateApplicationStatusSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/', authenticate, authorize('job_seeker'), validate(applyToJobSchema), jobApplicationController.applyToJob);
router.get('/my', authenticate, authorize('job_seeker'), jobApplicationController.getMyApplications);
router.patch('/:id/withdraw', authenticate, authorize('job_seeker'), jobApplicationController.withdrawApplication);

router.get('/job/:jobId', authenticate, authorize('employer', 'recruiter'), jobApplicationController.getApplicationsForJob);
router.patch('/:id/status', authenticate, authorize('employer', 'recruiter'), validate(updateApplicationStatusSchema), jobApplicationController.updateApplicationStatus);

export default router;