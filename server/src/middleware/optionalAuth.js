import { verifyAuthCookie } from './auth.js';

// Attach req.userId if a valid auth cookie is present; otherwise continue as anonymous.
// Never rejects — used on routes that anonymous visitors may also hit.
export function optionalAuth(req, res, next) {
  try {
    verifyAuthCookie(req);
  } catch {
    // ignore an invalid/expired cookie — treat as anonymous
  }
  next();
}
