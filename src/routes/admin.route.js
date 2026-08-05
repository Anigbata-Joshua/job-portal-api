import express from 'express';
import { verifyCompany, getPendingCompanies } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/companies/pending', authenticate, authorize('admin'), getPendingCompanies);
router.patch('/companies/:id/verify', authenticate, authorize('admin'), verifyCompany);

export default router;