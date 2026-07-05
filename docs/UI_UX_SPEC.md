# InsightFlow AI — UI/UX Specification

## 1. Design direction

**Warm & Inviting** — cheerful, energetic, approachable. Built for small-business owners, not developers. Dark + light mode from day one.

## 2. Design tokens

### Colors (light)

| Token | Hex | Use |
|---|---|---|
| `primary` | `#FFC107` Sunflower Yellow | Hero banner, score highlights, brand moments. Always **dark text** on yellow (10.6:1) |
| `accent` | `#E91E63` Vivid Pink | CTAs, primary buttons (white text — large/bold text only, 4.35:1), links |
| `secondary` | `#7B7C68` Olive Gray | Body-secondary text, card headings, muted UI (4.2:1 on white — AA normal text) |
| `neutral` | `#FDFDFD` | Section backgrounds |
| `bg` | `#FFFFFF` | Page background |

### Colors (dark)

Background `#1E1E1E` · yellow → muted gold `#FFD54F` · pink → rose `#F48FB1` · olive-gray → warm light gray `#B0B48C`.

### Interactive states

Hover: pink lightens to `#F06292` (or darken to `#D81B60` where white text needs more contrast). Focus: visible outline/glow, never removed. Active: yellow desaturates to `#E6A700`.

### Typography

**Poppins** (semi-bold) for headings, **Nunito** (regular) for body. Loaded via fontsource, self-hosted.

### Tailwind

Tokens defined once as CSS variables + Tailwind theme extension (`primary`, `secondary`, `accent`, `neutral`). No inline styles, no raw hex in components.

## 3. Pages

### 3.1 Landing `/`
- Hero **vertically centered in the viewport** (`flex; align-items:center` — never top/bottom-anchored).
- Headline: *"Is your website losing customers?"* Sub: *"Find out in less than 60 seconds."*
- URL input + pink **Analyze Website** button. Yellow banner treatment, dark headline text.
- Below fold: 3-step how-it-works, sample report teaser, footer.
- Anonymous quota exhausted → inline prompt to create a free account.

### 3.2 Audit progress `/audit/:id` (running)
- Staged checklist driven by SSE (poll fallback): Checking performance… ✓ Analyzing SEO… ✓ Checking accessibility… ✓ Checking security… ✓ Analyzing booking experience… ✓ Generating AI recommendations… ✓
- Overall progress bar (pct). Survives refresh (state from server). Framer Motion check-in animations. Feels premium, never a bare spinner.

### 3.3 Report `/audit/:id` (done)
- **Overall score**: animated gauge 0–100 (Recharts), color-banded (≥80 good / 50–79 warn / <50 poor).
- **Six section cards**: Performance, SEO, Accessibility, Security, Conversion, UX — score + top finding each; click to expand.
- **Findings list** per section, each finding a card: **Problem → Business Impact → Recommendation → Priority badge (High/Med/Low) → Estimated Improvement.** Business language only; technical evidence in a collapsible "details" row.
- Sticky action bar: Download PDF · Save (if anonymous → signup) · New audit.

### 3.4 Auth `/login`, `/register`
Minimal centered card. RHF + Zod, inline errors, loading states on submit.

### 3.5 Dashboard `/dashboard`
- Table/cards of audits: favicon+URL, overall score chip, date, favorite star, actions (view, PDF, delete-with-confirm).
- Search by URL. Empty state with CTA to run first audit.

## 4. Components (shared/)

`Button` (primary=pink, secondary=outline, ghost) · `Input` · `ScoreGauge` · `ScoreChip` · `SectionCard` · `FindingCard` · `PriorityBadge` · `Navbar` · `ThemeToggle` · `Loader` · `EmptyState` · `ConfirmDialog`. One responsibility each; no giant components.

## 5. PDF report (PDFKit, server)

Same tokens: Poppins/Nunito, yellow/pink accents. Structure: cover (logo, URL, date, overall gauge) → score summary bar chart → one section per page with findings in Problem/Impact/Recommendation layout → footer with branding. Printable, hand-to-a-client quality.

## 6. Accessibility & motion

- Contrast rules from the palette are non-negotiable (dark text on yellow; pink only for large/bold text or with darker border).
- Keyboard navigable, visible focus everywhere, form labels always.
- Framer Motion respects `prefers-reduced-motion`.

## 7. UX rules

- Every async action has loading, success, and error states.
- Errors are human: "We couldn't reach that website — check the address" not "ECONNREFUSED".
- The user never loses an audit: refresh mid-run resumes the progress screen.
