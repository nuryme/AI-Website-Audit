import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AnonQuota } from '../modules/audits/model.js';

const ANON_LIMIT = 3;

// Salted hash of the client IP — we never store raw IPs.
function hashIp(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return crypto.createHmac('sha256', env.JWT_SECRET).update(ip).digest('hex');
}

// Give anonymous callers a stable id (hashed IP) so they can read back their own audits.
// No-op for logged-in users. Run after optionalAuth.
export function anonIdentity(req, res, next) {
  if (!req.userId) req.anonId = hashIp(req);
  next();
}

// Cap anonymous audits at ANON_LIMIT. Logged-in users pass through. Count is incremented by the
// audit service on successful create.
// ponytail: check-then-increment isn't perfectly atomic, but VPN evasion is already accepted at
// this scale (SYSTEM_DESIGN §5) — a rare off-by-one under a race doesn't matter.
export const enforceAnonQuota = asyncHandler(async (req, res, next) => {
  if (req.userId) return next();

  const quota = await AnonQuota.findOne({ ipHash: req.anonId });
  if (quota && quota.count >= ANON_LIMIT) {
    throw new ApiError(403, 'You\'ve used your 3 free audits. Sign up for unlimited audits and a saved dashboard.');
  }
  next();
});
