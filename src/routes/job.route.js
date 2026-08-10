import express from 'express';
import { createJob, getJobs, getJob, updateJob, deleteJob } from '../controllers/job.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, createJobSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJob);// A single job

router.post('/', authenticate, authorize('employer', 'recruiter'), validate(createJobSchema), createJob);
router.patch('/:id', authenticate, authorize('employer', 'recruiter'), updateJob);
router.delete('/:id', authenticate, authorize('employer', 'recruiter'), deleteJob);

export default router;