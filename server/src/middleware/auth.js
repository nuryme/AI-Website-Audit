import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Verify the auth cookie and attach req.userId / req.userRole / req.tokenExp.
// Throws (jwt error) on an invalid/expired token; returns false when no cookie is present.
export function verifyAuthCookie(req) {
  const token = req.cookies?.token;
  if (!token) return false;
  const payload = jwt.verify(token, env.JWT_SECRET);
  req.userId = payload.sub;
  req.userRole = payload.role;
  req.tokenExp = payload.exp;
  return true;
}

// Require a valid JWT cookie; attaches req.userId / req.userRole for downstream handlers.
export function requireAuth(req, res, next) {
  if (!req.cookies?.token) throw new ApiError(401, 'Please sign in to continue.');

  try {
    verifyAuthCookie(req);
    next();
  } catch {
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }
}
