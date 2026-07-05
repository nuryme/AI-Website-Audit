import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createLeadSchema, updateLeadSchema, outreachSchema } from './validation.js';
import { create, list, update, remove, outreach } from './controller.js';

// Outreach generation spends AI budget — same posture as the audit fix endpoint.
const outreachLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });

// Leads are an account feature — every route requires sign-in.
export const leadsRouter = Router();
leadsRouter.use(requireAuth);

leadsRouter.post('/', validate(createLeadSchema), create);
leadsRouter.get('/', list);
leadsRouter.patch('/:id', validate(updateLeadSchema), update);
leadsRouter.delete('/:id', remove);
leadsRouter.post('/:id/outreach', outreachLimiter, validate(outreachSchema), outreach);
