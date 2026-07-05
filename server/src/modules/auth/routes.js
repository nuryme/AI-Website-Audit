import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { registerSchema, loginSchema } from './validation.js';
import { register, login, logout, me } from './controller.js';

// Tighter limit on credential endpoints to blunt brute-force / signup abuse.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), register);
authRouter.post('/login', authLimiter, validate(loginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
