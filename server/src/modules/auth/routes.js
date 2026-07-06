import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { anonIdentity } from '../../middleware/anonQuota.js';
import { registerSchema, loginSchema } from './validation.js';
import { register, login, logout, me } from './controller.js';

// Tighter limit on credential endpoints to blunt brute-force / signup abuse.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

export const authRouter = Router();

// anonIdentity: so a signup/login can claim this device's pre-auth audits (see auth/service.js).
authRouter.post('/register', authLimiter, anonIdentity, validate(registerSchema), register);
authRouter.post('/login', authLimiter, anonIdentity, validate(loginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);
