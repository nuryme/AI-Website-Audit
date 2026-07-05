import { env } from '../../config/env.js';

const RENDER_TIMEOUT_MS = 15_000;
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };
// Cap the full-page capture so an endless page can't blow up the base64 stored in Mongo (16MB doc limit).
const MAX_FULLPAGE_HEIGHT = 4000;

async function launchBrowser(chromium) {
  // On a memory-limited free-tier host, point BROWSER_WS_ENDPOINT at a hosted browser (e.g. browserless)
  // so the server stays thin; locally, launch a bundled Chromium.
  return env.BROWSER_WS_ENDPOINT
    ? chromium.connectOverCDP(env.BROWSER_WS_ENDPOINT)
    : chromium.launch({ args: ['--no-sandbox'] });
}

// Wait (bounded) for every started image to finish downloading — a triggered load isn't a
// completed one, and in-flight images render as gray boxes in the capture.
function waitForImages(page, timeoutMs) {
  return page
    .evaluate(
      (timeout) =>
        Promise.race([
          Promise.all(
            Array.from(document.images)
              .filter((img) => !img.complete)
              .map(
                (img) =>
                  new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  }),
              ),
          ),
          new Promise((resolve) => setTimeout(resolve, timeout)),
        ]),
      timeoutMs,
    )
    .catch(() => {});
}

// Scroll to the bottom in steps (each viewport into view fires IntersectionObserver-based
// lazy loaders and scroll-reveal animations), wait, then scroll back to the top.
async function scrollThroughPage(page) {
  await page
    .evaluate(async () => {
      /* eslint-env browser */
      // Browser-native lazy images only load near the viewport; force them all to load.
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = 'eager';
      });
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const step = window.innerHeight;
      // Cap steps so an infinite-scroll page (scrollHeight keeps growing) can't loop forever.
      for (let i = 0; i < 20 && i * step < document.documentElement.scrollHeight; i++) {
        window.scrollTo(0, i * step);
        await wait(250);
      }
      await wait(500); // let the bottom sections start their loads before leaving them
      window.scrollTo(0, 0);
      await wait(400);
    })
    .catch(() => {});
}

// The full readiness ladder between navigation and the first screenshot. A page is "ready"
// only after: network settles → fonts load → images load → lazy/scroll-revealed sections
// have been triggered and their loads finished → animations frozen so nothing is captured
// mid-transition. Every wait is bounded and best-effort — a stubborn page (endless polling,
// broken image) degrades to "shoot what we have", never a failed audit.
async function waitUntilPageReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page
    .evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]))
    .catch(() => {});
  await waitForImages(page, 5_000);
  await scrollThroughPage(page);
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  await waitForImages(page, 5_000); // the scroll pass starts new loads — wait for those too
  // Freeze CSS animations/transitions at their final state so entrance effects (fade-ins,
  // slide-ups) can't be caught halfway and carousels hold still across the three shots.
  await page
    .addStyleTag({
      content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
    })
    .catch(() => {});
}

// Open the page once in a headless browser and return the rendered HTML (so React/Vue/Angular content
// is visible to the content checks) plus desktop / mobile / full-page screenshots as base64 JPEGs.
// Rendering + screenshots only — performance/Lighthouse still come from PageSpeed Insights.
// Imported lazily so the server boots (and static audits still run) where Playwright isn't installed.
// ponytail: one browser visit per audit; mobile shot via viewport resize (CSS reflows) — device
// emulation with a reload is the upgrade path if a site's mobile layout needs load-time JS.
export async function renderPage(url) {
  const { chromium } = await import('playwright');
  const browser = await launchBrowser(chromium);
  try {
    const context = await browser.newContext({
      viewport: DESKTOP,
      userAgent: 'InsightFlowBot/1.0 (+https://insightflow.ai)',
    });
    const page = await context.newPage();
    try {
      // Fast arrival — readiness comes from the explicit waits below, not the navigation event.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT_MS });
    } catch {
      // very slow page — work with whatever has arrived by now
    }
    await waitUntilPageReady(page);

    const shot = (opts) =>
      page.screenshot({ type: 'jpeg', quality: 60, ...opts }).then((buf) => buf.toString('base64'));

    const desktop = await shot();
    // Full page, capped: never resize the viewport to do this — resizing changes what vh/vw
    // and min-h-screen-style units resolve to, which reflows (or collapses) every section sized
    // off the viewport right before the shot. `fullPage` captures the real layout as rendered;
    // `clip` (combinable with `fullPage`) crops it to the cap without touching viewport/layout.
    const pageHeight = await page
      .evaluate(() => document.documentElement.scrollHeight)
      .catch(() => DESKTOP.height);
    const fullPage = await shot({
      fullPage: true,
      clip: { x: 0, y: 0, width: DESKTOP.width, height: Math.min(pageHeight, MAX_FULLPAGE_HEIGHT) },
    });
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(400); // let the layout reflow to the phone width
    const mobile = await shot();

    // Extract the rendered DOM last, after every load/reveal has settled.
    const html = await page.content();

    return { html, screenshots: { desktop, mobile, fullPage } };
  } finally {
    await browser.close();
  }
}
