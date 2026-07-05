import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

// One thin Gemini client so the provider can be swapped in an afternoon. Free-tier flash model.
const MODEL = 'gemini-2.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ponytail: in-memory daily call counter, resets on process restart. Matches the free-tier /
// no-DB constraint; move to Mongo if the budget must survive restarts.
let usage = { day: new Date().toISOString().slice(0, 10), count: 0 };

function underBudget() {
  const today = new Date().toISOString().slice(0, 10);
  if (usage.day !== today) usage = { day: today, count: 0 };
  return usage.count < env.AI_DAILY_BUDGET;
}

// Google's free tier for this model caps at 20 requests/day, project-wide — far below
// AI_DAILY_BUDGET, and not something a process restart clears. Once Gemini reports that
// daily cap is hit, stop calling out entirely (retrying just burns more of an already-exhausted
// quota) and say so clearly, so "everything falls back to templates" has an obvious cause.
// ponytail: approximate 24h cooldown — Google's actual reset time may differ slightly.
let quotaResetAt = null;

function isDailyQuotaError(errBody) {
  try {
    const violations = JSON.parse(errBody)?.error?.details?.find((d) => d.violations)?.violations;
    return violations?.some((v) => v.quotaId?.includes('PerDay')) ?? false;
  } catch {
    return false;
  }
}

export function aiAvailable() {
  if (quotaResetAt && Date.now() < quotaResetAt) {
    logger.warn(
      { resetsAt: new Date(quotaResetAt).toISOString() },
      'Gemini daily quota is full — using template fallbacks until it resets',
    );
    return false;
  }
  return Boolean(env.GEMINI_API_KEY) && underBudget();
}

// Transient statuses worth retrying: rate-limited / overloaded / server error. Free-tier flash 503s a lot.
// 4xx like 400/401/403 won't fix themselves, so those fail fast to the template fallback.
const RETRYABLE = new Set([429, 500, 503]);
const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send a prompt expecting strict JSON back; returns the parsed object/array or throws.
// Pass `imageBase64` (JPEG) for multimodal calls (M7 vision judge).
// ponytail: fixed 3 attempts with linear backoff — enough for transient free-tier 503s; add jitter if it ever thunders.
export async function generateJson(prompt, imageBase64) {
  if (!aiAvailable()) throw new Error('AI unavailable or over daily budget');

  const parts = [{ text: prompt }];
  if (imageBase64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    usage.count += 1; // each attempt is a real API call against the daily budget
    const res = await fetch(`${ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini returned no content');
      return JSON.parse(text);
    }

    if (res.status === 429) {
      const errBody = await res.text().catch(() => '');
      if (isDailyQuotaError(errBody)) {
        quotaResetAt = Date.now() + 24 * 60 * 60 * 1000;
        logger.warn(
          { resetsAt: new Date(quotaResetAt).toISOString() },
          'Gemini free-tier daily quota exhausted (20 requests/day) — falling back to templates for ~24h',
        );
        throw new Error('Gemini daily quota exhausted');
      }
      if (attempt === MAX_ATTEMPTS) {
        logger.warn({ status: res.status, body: errBody, attempt }, 'Gemini request failed');
        throw new Error(`Gemini responded ${res.status}`);
      }
      logger.warn({ status: res.status, attempt }, 'Gemini transient error; retrying');
      await sleep(attempt * 600);
      continue;
    }

    if (!RETRYABLE.has(res.status) || attempt === MAX_ATTEMPTS) {
      const errBody = await res.text().catch(() => '');
      logger.warn({ status: res.status, body: errBody, attempt }, 'Gemini request failed');
      throw new Error(`Gemini responded ${res.status}`);
    }
    logger.warn({ status: res.status, attempt }, 'Gemini transient error; retrying');
    await sleep(attempt * 600); // 600ms, then 1200ms
  }
}
