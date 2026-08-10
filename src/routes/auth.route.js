import express from 'express';
import { register, login, refreshAccessToken, logout } from '../controllers/auth.controller.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

export default router;