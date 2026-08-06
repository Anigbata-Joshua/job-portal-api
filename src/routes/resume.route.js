import express from 'express';
import { createResume, getMyResumes, setDefaultResume, deleteResume } from '../controllers/resume.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', authenticate, authorize('job_seeker'), upload.single('resume'), createResume);
router.get('/my', authenticate, authorize('job_seeker'), getMyResumes);
router.patch('/:id/default', authenticate, authorize('job_seeker'), setDefaultResume);
router.delete('/:id', authenticate, authorize('job_seeker'), deleteResume);

export default router;