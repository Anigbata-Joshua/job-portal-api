import express from 'express';
import { createCompany, getCompany, updateCompany, addRecruiter,} from '../controllers/company.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, createCompanySchema } from '../middleware/validation.middleware.js';

const router = express.Router();

// Public — anyone can view a company's profile
router.get('/:id', getCompany);

// Authenticated — any logged-in user can create a company (which upgrades them to employer)
router.post('/', authenticate, validate(createCompanySchema), createCompany);

// Authenticated + owner-checked inside the controller itself
router.patch('/:id', authenticate, updateCompany);
router.post('/:id/recruiters', authenticate, addRecruiter);

export default router;