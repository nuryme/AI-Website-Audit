import crypto from 'node:crypto';
import { env } from '../config/env.js';

const COOKIE_NAME = 'anonId';
const COOKIE_MAX_AGE = 180 * 24 * 60 * 60 * 1000; // 180 days

// Give anonymous callers a stable id so they can read back their own audits, and so a later
// signup/login can claim them (see auth/service.js claimAnonAudits). This used to be a hash of
// the client IP, but real client IPs change request-to-request (mobile networks, proxy hops
// through Vercel/Railway), which made "audit not found" happen intermittently right after
// creating an audit. A random id in an httpOnly cookie is stable regardless of network path.
// No-op for logged-in users. Run after optionalAuth.
export function anonIdentity(req, res, next) {
  if (req.userId) return next();

  let anonId = req.cookies?.[COOKIE_NAME];
  if (!anonId) {
    anonId = crypto.randomUUID();
    res.cookie(COOKIE_NAME, anonId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });
  }
  req.anonId = anonId;
  next();
}
