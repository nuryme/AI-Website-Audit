# InsightFlow AI — System Design

## 1. Overview

```
Browser (React/Vite, Vercel)
   │  REST + SSE
Express API (TS, Render/Railway free tier)
   │
   ├── Crawler (fetch + cheerio)          — homepage HTML, robots.txt, sitemap.xml, link HEAD-checks
   ├── PageSpeed Insights API (Google)    — Lighthouse perf/a11y/SEO/best-practices + Core Web Vitals
   ├── Deterministic analyzers            — SEO, security, accessibility, conversion signals
   ├── AI layer (Gemini free tier)        — explanations + conversion rubric judge (never detection math)
   ├── PDFKit                             — server-generated report, streamed
   └── MongoDB Atlas (free tier)
```

Constraint driving the design: **everything runs on free tiers.** No Redis, no self-hosted Chrome, no queue service.

## 2. Repository layout

```
client/                      # React + Vite + TS (see client/CLAUDE.md)
server/
  src/
    modules/
      auth/                  # routes, controller, service, model, validation
      audits/                # routes, controller, pipeline service, model, checks/
      reports/               # PDFKit generation
      ai/                    # gemini client, prompt builders, template fallbacks
    middleware/              # auth, errorHandler, rateLimit, anonQuota
    config/                  # env (Zod-validated), db connection
    utils/
docs/                        # PRD.md, SYSTEM_DESIGN.md, UI_UX_SPEC.md
```

Request flow, every endpoint: **Route → Zod validation → Controller → Service → Model.** Controllers hold no business logic. Central error middleware + asyncHandler; Pino logging; Helmet, CORS, express-rate-limit.

## 3. Audit pipeline

`POST /api/audits` creates an audit with `status: "queued"`, returns `202 { auditId }`, and kicks off the pipeline **async in-process** (no queue; acceptable ceiling: an audit dies if the dyno restarts mid-run — it is marked `failed` on next fetch).

Each stage updates `audit.progress { stage, pct }` in Mongo and emits an SSE event:

| # | Stage | What happens |
|---|---|---|
| 1 | `crawl` | Fetch homepage (redirects followed, 10s timeout, 2MB cap), robots.txt, sitemap.xml; HEAD-check internal links for 404s |
| 2 | `performance` | One PSI API call (mobile strategy); store Lighthouse category scores + CWV, trimmed |
| 3 | `seo` | cheerio checks: title/meta-description presence+length, canonical, OG tags, heading hierarchy, img alts, robots/sitemap validity |
| 4 | `accessibility` | Lighthouse a11y score + own checks: alt text, form labels, `lang` attr |
| 5 | `security` | HTTPS, security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options), mixed content |
| 6 | `conversion` | Deterministic signals (CTA keyword + DOM position, phone/address present, form exists, viewport meta) **+ AI-judge**: extracted content (h1/hero text, CTA labels, nav items, DOM order) sent to Gemini with a fixed rubric → structured JSON findings. Backend validates the JSON and owns all scoring math |
| 7 | `ai` | One batched Gemini call: business-language explanation per finding (problem → impact → recommendation → priority → estimated improvement) |
| 8 | `done` | Compute section + overall scores, persist |

**Failure policy:** a failed stage records a partial result and the pipeline continues; the audit never crashes. Every finding has a stable `checkId` so template fallbacks (used when Gemini is unavailable/over quota) map 1:1 to AI explanations.

**Scoring:** each section 0–100 from its checks; overall = weighted average with named constants:
`performance 25, seo 20, conversion 20, accessibility 15, security 10, ux 10`.
Deterministic sections must produce identical scores on repeat runs of an unchanged site.

## 4. Progress delivery

Primary: `GET /api/audits/:id/events` — SSE stream of `{ stage, pct, status }`.
Fallback: client polls `GET /api/audits/:id` every 2s if SSE errors/disconnects.
Audit survives page refresh — progress lives in Mongo, not the connection.

## 5. Data model (MongoDB)

**users** — `name, email (unique index), passwordHash (bcrypt), role: "user"|"admin", timestamps`

**audits** — `url, userId (nullable), anonId (hashed IP, for anonymous), status: queued|running|done|failed, progress {stage, pct}, scores {overall, performance, seo, accessibility, security, conversion, ux}, findings[], rawPsi (trimmed), favorite, timestamps`
Indexes: `{userId, createdAt}`, `{anonId}`.

**findings[]** subdocument — `checkId, section, severity: high|medium|low, evidence (what the check saw), aiExplanation {problem, impact, recommendation, priority, estimatedImprovement}`

**anon_quotas** — `ipHash (unique), count` — cap 3, then 403 with signup prompt. Ceiling: VPN evasion is accepted at this scale.

## 6. API surface (v1)

```
POST   /api/auth/register        POST /api/auth/login
POST   /api/auth/logout          GET  /api/auth/me
POST   /api/audits               # 202 + auditId (anonQuota middleware if no session)
GET    /api/audits               # list own audits; ?search=
GET    /api/audits/:id
GET    /api/audits/:id/events    # SSE
DELETE /api/audits/:id
PATCH  /api/audits/:id/favorite
GET    /api/audits/:id/pdf       # streams PDFKit output; no PDF storage in v1
```

Auth: JWT in httpOnly, Secure, SameSite cookies. Never localStorage.

## 7. AI layer rules

- Gemini free tier, accessed only through `server/src/modules/ai/` — one thin client so the provider can be swapped in an afternoon.
- AI **never** decides scores or detects issues (exception: conversion rubric judge, whose JSON output is validated and scored by backend code).
- Global daily AI-call budget (env var). Over budget / API down → template explanations keyed by `checkId`; audits always complete.
- Prompts request strict JSON; responses are Zod-validated; invalid JSON → fallback templates.

## 8. Security

Helmet, CORS allowlist (`CLIENT_URL`), express-rate-limit on all routes (tighter on `POST /api/audits` and auth), bcrypt, Zod on every input, SSRF guard on submitted URLs (reject private/loopback IPs, non-http(s) schemes), no secrets in code or git.

## 9. Environment

`MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, PSI_API_KEY, CLIENT_URL, AI_DAILY_BUDGET`
Validated at boot with Zod in `server/src/config/env.js`; boot fails fast on missing vars.

## 10. Deployment

Client → Vercel. Server → Render or Railway free tier. DB → Atlas M0. All secrets via platform env vars.
