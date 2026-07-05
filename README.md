# InsightFlow AI

**Analyze. Improve. Convert.** — AI-powered website audits for small businesses, in plain English.

Local business owners know their website exists but have no idea whether it actually works. Tools like Lighthouse or GTmetrix report "CLS is poor" or "LCP is 4.2s" — meaningless to a dentist, restaurant owner, or salon. InsightFlow runs the same technical checks but translates every finding into business language:

| Instead of | We say |
|---|---|
| Missing alt attributes | Search engines understand your images less effectively, reducing your visibility |
| LCP is 4.2s | People are leaving your website before it finishes loading |
| CTA below the fold | Your booking button is hidden — visitors leave without scheduling |

Detection is always deterministic; AI (Gemini) only explains findings and suggests improvements — it never decides scores.

## How it works

1. Paste a URL on the landing page
2. An async pipeline crawls the site, runs PageSpeed Insights, and analyzes SEO, accessibility, security, and conversion signals — with live progress over SSE
3. Get a scored report (0–100 overall + six sections), each finding broken into **Problem → Business Impact → Recommendation → Priority → Estimated Improvement**
4. Download a branded PDF, or create an account for unlimited audits, history, and favorites

## Stack

- **Client** (`client/`) — React 19 + Vite + Tailwind CSS, React Query, React Hook Form + Zod, deployed on Vercel
- **Server** (`server/`) — Express + Mongoose + Zod, feature-modular (`modules/auth`, `modules/audits`, `modules/ai`, `modules/reports`), deployed on Railway
- **Data** — MongoDB Atlas
- **AI** — Gemini free tier, with template fallback whenever it's unavailable or over quota
- **Rendering** — Playwright, connecting to a hosted browser (Browserless) in production so the server stays lightweight

Full architecture: [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md). Product spec: [`docs/PRD.md`](docs/PRD.md). Design tokens/UI spec: [`docs/UI_UX_SPEC.md`](docs/UI_UX_SPEC.md).

## Local development

```bash
# server
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, etc.
npm run dev             # http://localhost:5000

# client
cd client
npm install
npm run dev              # http://localhost:5173, proxies /api to the server
```

## Deployment

- **Client → Vercel**: root directory `client`; `client/vercel.json` rewrites `/api/*` to the Railway server so cookies stay same-site.
- **Server → Railway**: root directory `server`; set `BROWSER_WS_ENDPOINT` (Browserless) so Playwright doesn't need a local Chromium.

Required server environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `GEMINI_API_KEY`, `PSI_API_KEY`, `AI_DAILY_BUDGET`, `BROWSER_WS_ENDPOINT` — see `server/.env.example`.
