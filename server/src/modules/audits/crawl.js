import * as cheerio from 'cheerio';
import { logger } from '../../config/logger.js';
import { renderPage } from './render.js';

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB cap
const MAX_LINK_CHECKS = 10; // cap HEAD checks so a link-heavy page can't stall the audit

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: 'follow', signal: controller.signal, ...options });
  } finally {
    clearTimeout(timer);
  }
}

// Read at most MAX_BYTES of the body so a huge page can't exhaust memory.
async function readCapped(res) {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    chunks.push(value);
    if (total >= MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function exists(url) {
  try {
    const res = await fetchWithTimeout(url, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// Crawl the homepage plus robots.txt / sitemap.xml, and HEAD-check a sample of internal links.
export async function crawl(rawUrl) {
  const res = await fetchWithTimeout(rawUrl);
  let html = await readCapped(res);
  let $ = cheerio.load(html);
  let screenshots = null;
  const finalUrl = res.url || rawUrl;
  const origin = new URL(finalUrl).origin;

  // Render in a headless browser to (a) reveal JS-rendered content (React/Vue/etc.) for the content
  // checks and (b) capture screenshots. Always prefer the rendered HTML when rendering succeeds —
  // raw HTML length isn't a reliable signal (Shopify/Wix/Squarespace often embed huge inline JSON
  // that makes the pre-JS fetch longer than the rendered DOM). Keep the raw fetch (above) for
  // response headers + as the fallback if the browser is unavailable/over quota.
  try {
    const rendered = await renderPage(finalUrl);
    if (rendered.html) {
      html = rendered.html;
      $ = cheerio.load(html);
    }
    screenshots = rendered.screenshots;
    logger.info({ url: finalUrl }, 'Rendered page in headless browser');
  } catch (err) {
    logger.warn({ err, url: finalUrl }, 'Headless render failed; using raw HTML, no screenshots');
  }

  const internalLinks = [
    ...new Set(
      $('a[href]')
        .map((_, el) => $(el).attr('href'))
        .get()
        .map((href) => {
          try {
            return new URL(href, finalUrl).toString();
          } catch {
            return null;
          }
        })
        .filter((u) => u && u.startsWith(origin)),
    ),
  ];

  // HEAD-check the sampled links in parallel; a network error isn't a definitive 404, so
  // only fulfilled 404 responses count as broken.
  const linkChecks = await Promise.allSettled(
    internalLinks.slice(0, MAX_LINK_CHECKS).map(async (link) => {
      const r = await fetchWithTimeout(link, { method: 'HEAD' });
      return r.status === 404 ? link : null;
    }),
  );
  const brokenLinks = linkChecks
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  const [robotsFound, sitemapFound] = await Promise.all([
    exists(`${origin}/robots.txt`),
    exists(`${origin}/sitemap.xml`),
  ]);

  return {
    finalUrl,
    status: res.status,
    headers: res.headers,
    html,
    $,
    robotsFound,
    sitemapFound,
    brokenLinks,
    screenshots,
  };
}
