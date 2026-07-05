import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// Core Web Vitals thresholds (mobile, "poor" boundary per web.dev).
const CWV = {
  'largest-contentful-paint': { limit: 2500, id: 'perf-lcp', label: 'Largest Contentful Paint' },
  'cumulative-layout-shift': { limit: 0.1, id: 'perf-cls', label: 'Cumulative Layout Shift' },
  'total-blocking-time': { limit: 200, id: 'perf-tbt', label: 'Total Blocking Time' },
};

// One PSI call (mobile). Returns a 0–100 performance score, findings, and a trimmed raw payload.
// No key / API failure → available:false so the pipeline records a partial and continues.
export async function runPerformance(url) {
  if (!env.PSI_API_KEY) {
    return {
      available: false,
      performanceScore: null,
      findings: [
        {
          checkId: 'perf-unavailable',
          section: 'performance',
          severity: 'low',
          evidence: 'Performance data unavailable (PageSpeed Insights key not configured).',
        },
      ],
      rawPsi: null,
    };
  }

  const params = new URLSearchParams({ url, strategy: 'mobile', key: env.PSI_API_KEY });
  ['performance', 'accessibility', 'seo', 'best-practices'].forEach((c) =>
    params.append('category', c),
  );

  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params}`);
    if (!res.ok) throw new Error(`PSI responded ${res.status}`);
    const data = await res.json();
    const lh = data.lighthouseResult;
    const perf = lh.categories.performance?.score ?? null;

    const findings = [];
    for (const [auditKey, cfg] of Object.entries(CWV)) {
      const metric = lh.audits?.[auditKey];
      if (metric?.numericValue != null && metric.numericValue > cfg.limit) {
        findings.push({
          checkId: cfg.id,
          section: 'performance',
          severity: metric.numericValue > cfg.limit * 2 ? 'high' : 'medium',
          evidence: `${cfg.label}: ${metric.displayValue ?? metric.numericValue}`,
        });
      }
    }

    return {
      available: true,
      performanceScore: perf == null ? null : Math.round(perf * 100),
      findings,
      rawPsi: {
        performance: perf,
        accessibility: lh.categories.accessibility?.score ?? null,
        seo: lh.categories.seo?.score ?? null,
        bestPractices: lh.categories['best-practices']?.score ?? null,
      },
    };
  } catch (err) {
    logger.warn({ err }, 'PSI call failed; recording partial performance result');
    return {
      available: false,
      performanceScore: null,
      findings: [
        {
          checkId: 'perf-unavailable',
          section: 'performance',
          severity: 'low',
          evidence: 'Performance data could not be retrieved from PageSpeed Insights.',
        },
      ],
      rawPsi: null,
    };
  }
}
