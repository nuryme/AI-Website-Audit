import { pino } from 'pino';
import { env } from './env.js';

// Pretty logs in dev, JSON in production. Never use console.log elsewhere.
export const logger = pino(
  env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {},
);
