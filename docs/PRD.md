# InsightFlow AI — Product Requirements Document

**Tagline:** Analyze. Improve. Convert. — AI-powered website audits for small businesses.

## 1. Problem

Local business owners (dentists, restaurants, salons, gyms) paid for a website years ago and have no idea whether it works. Existing audit tools (Lighthouse, GTmetrix, SEO checkers) speak developer language — "CLS is poor", "LCP is 4.2s" — which means nothing to them. They only know: *"I'm not getting enough customers."*

## 2. Solution

InsightFlow audits a website and **translates every technical finding into business language**:

| Instead of | We say |
|---|---|
| Missing alt attributes | Search engines understand your images less effectively, reducing your visibility |
| LCP is 4.2s | People are leaving your website before it finishes loading |
| CTA below the fold | Your booking button is hidden — visitors leave without scheduling |

**Core principle:** the backend detects issues with deterministic checks; AI only explains them and suggests improvements. AI is one box in the pipeline, not the product.

## 3. Target users

**v1:** local service businesses — dental clinics, restaurants, salons, gyms.
**Later:** agencies, freelancers, SaaS companies.

## 4. Pricing

Free for everyone in v1. No payments. (SaaS tiers designed later; nothing in v1 may block adding them.)

- **Anonymous visitor:** 3 audits total (tracked by hashed IP), full report visible.
- **Registered user:** unlimited audits + dashboard, history, favorites, PDF download.

## 5. v1 features (ship line)

1. **Landing page** — hero with URL input: "Is your website losing customers? Find out in less than 60 seconds."
2. **Audit** — enter URL → async pipeline → staged real-time progress screen (SSE): Checking performance ✓ → Analyzing SEO ✓ → … → Generating AI recommendations ✓
3. **Report** — animated overall score gauge (0–100) + six sections: Performance, SEO, Accessibility, Security, Conversion, UX. Every finding: **Problem → Business Impact → Recommendation → Priority → Estimated Improvement.**
4. **Auth** — email/password, JWT in httpOnly cookies, roles `user`/`admin` (admin unused until later).
5. **Dashboard** — list, search, delete, favorite audits; download PDF.
6. **PDF export** — branded, chart-bearing report generated server-side (PDFKit), streamed to download.

## 6. Deferred (v1.1+)

AI rewrite ("Improve Hero"), competitor comparison, admin panel, screenshot/vision analysis, lead-finder & outreach module (search leads → bulk audit → outreach emails → reply/follow-up tracking), white-label reports, multi-language, payments.

## 7. Non-goals for v1

- No multi-page site crawls (homepage-deep only; robots.txt/sitemap/broken-link checks around it).
- No self-hosted Chrome/Lighthouse (PageSpeed Insights API instead).
- No AI-driven issue detection (one exception: the Conversion AI-judge scores extracted content against a fixed rubric; backend still owns the math).

## 8. Success criteria

- Audit completes in ≤ 60s for a typical site; identical deterministic scores on repeat runs.
- A non-technical reader understands every finding without googling.
- Zero-cost operation: free hosting tiers, PSI free API, Gemini free tier (with template fallback when AI is unavailable).
- The report PDF is good enough to hand to a business owner as-is.
