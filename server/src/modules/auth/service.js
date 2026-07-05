import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from './model.js';

const TOKEN_TTL = '5h';

// Pass `exp` (unix seconds) to reissue a token that keeps the original expiry —
// sessions end 5h after login no matter how many times the token is refreshed.
export function signToken(user, exp) {
  const payload = { sub: user.id, role: user.role };
  return exp
    ? jwt.sign({ ...payload, exp }, env.JWT_SECRET)
    : jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with that email already exists.');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  return { user, token: signToken(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  // Same error whether the email is unknown or the password is wrong — no account enumeration.
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new ApiError(401, 'Invalid email or password.');
  return { user, token: signToken(user) };
}

export async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(401, 'Session no longer valid. Please sign in again.');
  return user;
}
