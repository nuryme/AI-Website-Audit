import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/routes.js';
import { auditsRouter } from './modules/audits/routes.js';
import { leadsRouter } from './modules/leads/routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  // One compact line per request; the default serializers dump full headers (incl. auth cookies).
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: (req) => `${req.method} ${req.url}`,
        res: (res) => res.statusCode,
      },
    }),
  );
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 })); // global baseline; tighter limits per-route later

  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  app.use('/api/auth', authRouter);
  app.use('/api/audits', auditsRouter);
  app.use('/api/leads', leadsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
