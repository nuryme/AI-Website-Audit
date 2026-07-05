# Backend conventions (server/)

Express + **JavaScript (ES modules, not TypeScript)** + Mongoose + Zod + Pino. Feature-modular, not one big MVC.

## Structure

```
src/
  modules/
    auth/      # routes.js, controller.js, service.js, model.js, validation.js
    audits/    # + pipeline.js (orchestrator), checks/ (one file per analyzer)
    reports/   # PDFKit generation
    ai/        # gemini client, prompts, template fallbacks — ONLY place that touches the AI API
  middleware/  # auth, errorHandler, rateLimit, anonQuota
  config/      # env.js (Zod-validated, fail fast), db.js
```

## Request flow — every endpoint

Route → Zod validation → Controller (thin: parse, call service, respond) → Service (all business logic) → Model. No business logic in controllers, no Mongoose calls in services' callers.

## Error handling & logging

- `asyncHandler` wrapper + one global error middleware. No per-controller try/catch.
- Pino for all logging. Never `console.log`.
- Errors returned to clients are human-readable and leak no internals.

## Audit pipeline (full spec: docs/SYSTEM_DESIGN.md §3)

Stages: crawl → performance (PSI API) → seo → accessibility → security → conversion (deterministic + AI rubric judge) → ai explanations → done.
- Runs async in-process; each stage writes `progress {stage, pct}` to Mongo and emits SSE.
- A failed stage records a partial result and the pipeline continues — an audit never crashes.
- Findings carry stable `checkId`s; template fallbacks map 1:1 when Gemini is unavailable.
- Scoring weights are named constants; deterministic sections must be reproducible run-to-run.

## Security (non-negotiable)

- JWT in httpOnly/Secure/SameSite cookies — never localStorage/headers.
- Zod-validate every request body/param/query.
- SSRF guard on submitted URLs: http(s) only, reject private/loopback/link-local IPs.
- Helmet, CORS allowlist (CLIENT_URL), express-rate-limit (tighter on POST /api/audits and auth).
- bcrypt for passwords. Secrets only via env (`config/env.ts`).

## Rules

- AI calls go through `modules/ai/` only; respect `AI_DAILY_BUDGET`; responses are Zod-validated JSON with template fallback.
- Indexes on frequently queried fields (`{userId, createdAt}`, `{anonId}`, unique email).
- After changes: `npm run lint`.
