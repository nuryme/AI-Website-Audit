import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '../../middleware/optionalAuth.js';
import { requireAuth } from '../../middleware/auth.js';
import { anonIdentity } from '../../middleware/anonQuota.js';
import { validate } from '../../middleware/validate.js';
import { createAuditSchema, fixSchema } from './validation.js';
import { create, list, getOne, remove, favorite, events, downloadPdf, fix } from './controller.js';

// Tighter limit on the expensive create endpoint.
const createLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
// Fix generation spends AI budget — limited, but looser than create (one click per finding).
const fixLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });
const favoriteSchema = z.object({ favorite: z.boolean() });

export const auditsRouter = Router();

// Create: anonymous or logged in, unlimited — createLimiter is the only abuse guard.
auditsRouter.post('/', createLimiter, optionalAuth, anonIdentity, validate(createAuditSchema), create);

// Read: owner-scoped; anonymous callers see their own (by hashed-IP anonId).
auditsRouter.get('/', optionalAuth, anonIdentity, list);
auditsRouter.get('/:id', optionalAuth, anonIdentity, getOne);
auditsRouter.get('/:id/events', optionalAuth, anonIdentity, events);
auditsRouter.get('/:id/pdf', optionalAuth, anonIdentity, downloadPdf);
auditsRouter.post('/:id/fix', fixLimiter, optionalAuth, anonIdentity, validate(fixSchema), fix);

// Mutations that require an account.
auditsRouter.delete('/:id', requireAuth, remove);
auditsRouter.patch('/:id/favorite', requireAuth, validate(favoriteSchema), favorite);
