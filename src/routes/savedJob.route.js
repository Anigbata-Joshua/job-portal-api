import express from 'express';
import * as savedJobController from '../controllers/savedJob.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, authorize('job_seeker'), savedJobController.saveJob);
router.get('/', authenticate, authorize('job_seeker'), savedJobController.getSavedJobs);
router.delete('/:jobId', authenticate, authorize('job_seeker'), savedJobController.unsaveJob);

export default router;