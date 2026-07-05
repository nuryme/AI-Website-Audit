import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDb() {
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  await mongoose.connect(env.MONGODB_URI);
  // Log which DB we actually landed in — a URI without a db name silently connects to `test`.
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
}
