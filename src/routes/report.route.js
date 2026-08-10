import express from 'express';
import { getSeekerReport, getEmployerReport, getAdminReport } from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/seeker', authenticate, authorize('job_seeker'), getSeekerReport);
router.get('/employer', authenticate, authorize('employer', 'recruiter'), getEmployerReport);
router.get('/admin', authenticate, authorize('admin'), getAdminReport);

export default router;
