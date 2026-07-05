import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity (4 args)
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Malformed ObjectId in a route param (e.g. /audits/garbage) — treat as not found, not a 500.
  if (err.name === 'CastError') {
    return res.status(404).json({ error: 'Not found.' });
  }

  // Unknown/unexpected error: log it, never leak internals to the client.
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    error: 'Something went wrong. Please try again.',
    ...(env.NODE_ENV === 'development' ? { message: err.message } : {}),
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
