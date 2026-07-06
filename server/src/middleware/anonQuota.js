import crypto from 'node:crypto';
import { env } from '../config/env.js';

// Salted hash of the client IP — we never store raw IPs.
function hashIp(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return crypto.createHmac('sha256', env.JWT_SECRET).update(ip).digest('hex');
}

// Give anonymous callers a stable id (hashed IP) so they can read back their own audits,
// and so a later signup/login can claim them (see auth/service.js claimAnonAudits).
// No-op for logged-in users. Run after optionalAuth.
export function anonIdentity(req, res, next) {
  if (!req.userId) req.anonId = hashIp(req);
  next();
}
