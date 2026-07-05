import { logger } from '../../config/logger.js';
import { Audit } from './model.js';
import { emitProgress } from './sse.js';
import { crawl } from './crawl.js';
import { runPerformance } from './performance.js';
import { checkSeo } from './checks/seo.js';
import { checkAccessibility } from './checks/accessibility.js';
import { checkSecurity } from './checks/security.js';
import { checkConversion } from './checks/conversion.js';
import { checkUx } from './checks/ux.js';
import { explainFindings, judgeConversion, judgeVision } from '../ai/index.js';
import { computeScores, estimateRevenueOpportunity } from './scoring.js';
import { industryPack } from './industries.js';

async function setProgress(audit, stage, pct, status = 'running') {
  audit.status = status;
  audit.progress = { stage, pct };
  await audit.save();
  emitProgress(audit.id, { stage, pct, status });
}

// Run one deterministic check, never letting a thrown check kill the pipeline.
function safe(label, fn) {
  try {
    return fn() ?? [];
  } catch (err) {
    logger.warn({ err, label }, 'Check failed; recording no findings for it');
    return [];
  }
}

// Pull the content the conversion AI-judge reasons over (nothing sensitive, homepage-only).
function extractForJudge($) {
  return {
    h1: $('h1').first().text().trim().slice(0, 200),
    heroText: $('h1, h2, p').slice(0, 5).map((_, el) => $(el).text().trim()).get().join(' ').slice(0, 600),
    ctaLabels: $('a, button').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 15),
    navItems: $('nav a').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 12),
  };
}

// Async, in-process. Kicked off (not awaited) after POST /api/audits responds 202.
export async function runPipeline(auditId) {
  const audit = await Audit.findById(auditId);
  if (!audit) return;

  try {
    // 1. crawl — input to every deterministic check; if it fails the audit can't proceed.
    let site;
    try {
      await setProgress(audit, 'crawl', 15);
      site = await crawl(audit.url);
    } catch (err) {
      logger.warn({ err, auditId }, 'Crawl failed; marking audit failed');
      audit.findings = [
        {
          checkId: 'crawl-failed',
          section: 'ux',
          severity: 'high',
          evidence: 'The site could not be loaded (timeout, blocked, or unreachable).',
        },
      ];
      await setProgress(audit, 'crawl', 100, 'failed');
      return;
    }

    // 2. performance (PSI) — slow external call; runs while the deterministic checks do.
    // runPerformance never throws (records a partial result internally).
    await setProgress(audit, 'performance', 35);
    const perfPromise = runPerformance(site.finalUrl);

    // 3–6. deterministic analyzers
    await setProgress(audit, 'seo', 50);
    const seo = safe('seo', () => checkSeo(site));

    await setProgress(audit, 'accessibility', 60);
    const a11y = safe('accessibility', () => checkAccessibility(site));

    await setProgress(audit, 'security', 70);
    const security = safe('security', () => checkSecurity(site));

    const pack = industryPack(audit.industry);

    await setProgress(audit, 'conversion', 82);
    const conversionDet = safe('conversion', () => checkConversion(site, pack));
    const ux = safe('ux', () => checkUx(site));

    // AI judges run concurrently: conversion rubric + vision (M7, qualitative findings from the
    // desktop screenshot). Each returns [] on no-screenshot/AI-unavailable — the audit completes either way.
    await setProgress(audit, 'vision', 90);
    const [conversionAi, visionAi] = await Promise.all([
      judgeConversion(extractForJudge(site.$), pack.label),
      judgeVision(site.screenshots?.desktop, pack.label),
    ]);

    const perf = await perfPromise;
    let findings = [...perf.findings, ...seo, ...a11y, ...security, ...conversionDet, ...conversionAi, ...visionAi, ...ux];

    // 7. AI explanations (template fallback inside)
    await setProgress(audit, 'ai', 95);
    findings = await explainFindings(findings);

    // 8. score + persist
    audit.findings = findings;
    audit.scores = computeScores(findings, perf.performanceScore);
    audit.revenueEstimate = estimateRevenueOpportunity(audit.scores.overall, pack.avgCustomerValue);
    audit.rawPsi = perf.rawPsi;
    audit.screenshots = site.screenshots; // captured during crawl; null if the render was unavailable
    await setProgress(audit, 'done', 100, 'done');
  } catch (err) {
    // Safety net: nothing above should throw uncaught, but never leave an audit stuck "running".
    logger.error({ err, auditId }, 'Pipeline crashed unexpectedly');
    audit.status = 'failed';
    audit.progress = { stage: 'failed', pct: 100 };
    await audit.save().catch(() => {});
    emitProgress(audit.id, { stage: 'failed', pct: 100, status: 'failed' });
  }
}
