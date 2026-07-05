import 'dotenv/config';
import { z } from 'zod';

// A `KEY=` line in .env yields an empty string — treat it as unset for optional/defaulted vars.
const emptyAsUnset = (inner) => z.preprocess((v) => v || undefined, inner);

// Fail fast at boot if required env vars are missing or malformed.
const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  CLIENT_URL: emptyAsUnset(z.string().url().default('http://localhost:5173')),
  // AI/PSI keys are optional in dev; audits fall back to templates when absent.
  GEMINI_API_KEY: emptyAsUnset(z.string().optional()),
  PSI_API_KEY: emptyAsUnset(z.string().optional()),
  // Optional hosted browser (e.g. browserless) for JS rendering on memory-limited hosts; local Chromium if unset.
  BROWSER_WS_ENDPOINT: emptyAsUnset(z.string().url().optional()),
  AI_DAILY_BUDGET: z.coerce.number().default(500),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
