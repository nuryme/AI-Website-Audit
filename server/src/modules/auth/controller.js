import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';
import { registerUser, loginUser, getUserById, signToken } from './service.js';

const COOKIE_NAME = 'token';
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 5 * 60 * 60 * 1000, // 5h, matches token TTL
};

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await registerUser(req.validated, req.anonId);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.validated, req.anonId);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getUserById(req.userId);
  // Fresh token on every page load, keeping the original expiry (hard logout 5h after login).
  res.cookie(COOKIE_NAME, signToken(user, req.tokenExp), {
    ...cookieOptions,
    maxAge: req.tokenExp * 1000 - Date.now(),
  });
  res.json({ user });
});
