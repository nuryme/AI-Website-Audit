import { z } from 'zod';
import { logger } from '../../config/logger.js';
import { generateJson, aiAvailable } from './gemini.js';
import { templateExplanation } from './templates.js';

// ---- Stage 7: business-language explanations for every finding ----

const explanationSchema = z.object({
  checkId: z.string(),
  problem: z.string(),
  impact: z.string(),
  recommendation: z.string(),
  estimatedImprovement: z.string(),
});
const explanationsSchema = z.array(explanationSchema);

function explainPrompt(findings) {
  const list = findings.map((f) => ({
    checkId: f.checkId,
    section: f.section,
    severity: f.severity,
    evidence: f.evidence,
  }));
  return `You are explaining website audit findings to a non-technical local business owner (dentist, restaurant, salon, gym).
For EACH finding below, write plain business language — no jargon, no googling required.
Return ONLY a JSON array; each item: { "checkId", "problem", "impact", "recommendation", "estimatedImprovement" }.
- problem: one sentence, what's wrong, in everyday words.
- impact: how it costs them customers or trust.
- recommendation: one concrete action.
- estimatedImprovement: a short realistic phrase (not a number).
Keep the same checkId values. Findings:
${JSON.stringify(list)}`;
}

// Returns findings with aiExplanation attached. Falls back to templates per-finding on any failure,
// so the pipeline always produces complete explanations.
export async function explainFindings(findings) {
  if (findings.length === 0) return findings;

  const withTemplates = () =>
    findings.map((f) => ({ ...f, aiExplanation: templateExplanation(f) }));

  if (!aiAvailable()) return withTemplates();

  try {
    const parsed = explanationsSchema.parse(await generateJson(explainPrompt(findings)));
    const byId = new Map(parsed.map((e) => [e.checkId, e]));
    return findings.map((f) => {
      const ai = byId.get(f.checkId);
      if (!ai) return { ...f, aiExplanation: templateExplanation(f) };
      return {
        ...f,
        aiExplanation: {
          problem: ai.problem,
          impact: ai.impact,
          recommendation: ai.recommendation,
          priority: f.severity,
          estimatedImprovement: ai.estimatedImprovement,
        },
      };
    });
  } catch (err) {
    logger.warn({ err }, 'AI explanation failed; using template fallbacks');
    return withTemplates();
  }
}

// ---- Stage 6: conversion rubric judge ----
// AI scores extracted content against a FIXED rubric and returns findings; backend owns all math.

const judgeSchema = z.array(
  z.object({
    checkId: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    evidence: z.string(),
  }),
);

function judgePrompt(extracted, industryLabel) {
  return `You are a conversion-optimization judge for a ${industryLabel} homepage.
Assess ONLY these aspects and return a JSON array of findings for problems you actually observe:
- Value clarity: does the hero text make it obvious what the business does and where? (checkId "conv-ai-value-clarity")
- CTA strength: is there a compelling, action-oriented call-to-action label? (checkId "conv-ai-cta-strength")
- Trust signals: any mention of reviews, credentials, guarantees, years in business? (checkId "conv-ai-trust-signals")
Each finding: { "checkId", "severity" (high|medium|low), "evidence" (one factual sentence about what you saw) }.
Only include a finding when there IS a problem. Return [] if all three are fine.
Extracted homepage content:
${JSON.stringify(extracted)}`;
}

// Shared scaffold for the bounded AI judges: prompt in → schema-validated findings out, tagged
// with their section. Empty array on unavailable/invalid — never throws.
async function runJudge(label, prompt, section, imageBase64) {
  if (!aiAvailable()) return [];
  try {
    const parsed = judgeSchema.parse(await generateJson(prompt, imageBase64));
    return parsed.map((f) => ({ ...f, section }));
  } catch (err) {
    logger.warn({ err }, `${label} failed; skipping its findings`);
    return [];
  }
}

export function judgeConversion(extracted, industryLabel = 'local business') {
  return runJudge('Conversion AI judge', judgePrompt(extracted, industryLabel), 'conversion');
}

// ---- M7: vision judge ----
// Multimodal Gemini reads the desktop screenshot against a FIXED rubric. Bounded judge:
// qualitative findings only — all numeric scoring stays in backend code (scoring.js).

function visionPrompt(industryLabel) {
  return `You are a visual-design judge looking at a homepage screenshot of a ${industryLabel}.
Assess ONLY these aspects and return a JSON array of findings for problems you actually SEE in the image:
- CTA visibility: is the main call-to-action button visually prominent in the first screen? (checkId "ux-ai-cta-visibility")
- Hero & trust: does the top of the page look professional and trustworthy for a ${industryLabel}? (checkId "ux-ai-hero-trust")
- Visual hierarchy: clear main heading, readable text sizes, not cluttered? (checkId "ux-ai-visual-hierarchy")
Each finding: { "checkId", "severity" (high|medium|low), "evidence" (one factual sentence about what the screenshot shows) }.
Only include a finding when there IS a problem. Return [] if all three look fine.`;
}

// Returns UX findings from the screenshot. Empty array when no screenshot — never throws.
export function judgeVision(screenshotBase64, industryLabel = 'local business') {
  if (!screenshotBase64) return Promise.resolve([]);
  return runJudge('Vision AI judge', visionPrompt(industryLabel), 'ux', screenshotBase64);
}

// ---- M9: one-click fix generation ----

const fixSchema = z.object({ fix: z.string().min(1) });

// Returns ready-to-use fix text for one finding, or null when AI is unavailable/failed —
// the caller falls back to the finding's recommendation without caching it, so the
// finding still gets a real AI fix once quota returns.
export async function generateFix(finding, { url, industryLabel = 'local business' } = {}) {
  if (!aiAvailable()) return null;

  const prompt = `You write copy-paste-ready fixes for local business websites.
Website: ${url} (a ${industryLabel}).
Finding: ${JSON.stringify({
    checkId: finding.checkId,
    evidence: finding.evidence,
    problem: finding.aiExplanation?.problem,
    recommendation: finding.aiExplanation?.recommendation,
  })}
Return ONLY JSON: { "fix": "..." }.
"fix" must be concrete, ready-to-use content the owner can paste or hand to their developer —
e.g. the rewritten headline text, the exact meta description, the HTML snippet, or numbered steps.
Plain business language, under 120 words.`;

  try {
    return fixSchema.parse(await generateJson(prompt)).fix;
  } catch (err) {
    logger.warn({ err, checkId: finding.checkId }, 'AI fix generation failed; using recommendation fallback');
    return null;
  }
}

// ---- M10: outreach message generation ----
// Structured prompt, not freestyle: a business-language context object, strict rules,
// few-shot examples, a chosen writing style + CTA, and a fixed message framework.

const messageSchema = z.object({ message: z.string().min(1) });

const CHANNEL_FORMAT = {
  email: 'a cold outreach email: one short subject line, then the body. Maximum 170 words.',
  whatsapp: 'a WhatsApp message. Maximum 80 words, conversational, no formal letter structure.',
  linkedin: 'a LinkedIn connection note. Maximum 60 words.',
  proposal:
    'a mini proposal: greeting, the key issues as short bullets, what you would do, a [price] placeholder, and a clear next step. Maximum 200 words.',
};

const STYLE_GUIDE = {
  friendly: 'Warm and neighborly. Contractions welcome. Like a helpful local you would trust.',
  professional: 'Polished and courteous. Measured wording, no slang.',
  ceo: 'Brief and confident, peer-to-peer between business owners. Zero fluff.',
  luxury: 'Refined and understated. Vocabulary of quality and craft, never salesy.',
  direct: 'Short sentences. Straight to the point. No pleasantries beyond the greeting.',
  casual: 'Relaxed, like messaging a friend-of-a-friend. Light and easygoing.',
};

const CTA_INSTRUCTION = {
  reply: 'invite them to simply reply to this message',
  'book-call': 'invite them to book a quick 15-minute call',
  'full-report': 'offer to send over the full report of what you found',
  'free-redesign': 'offer a free redesign mockup of their homepage',
  'free-consultation': 'offer a free consultation',
  'free-audit-review': 'offer to walk them through everything you found, free',
};

// Few-shot examples: how a technical finding becomes an email sentence. Teaches the
// translation style so nothing technical ever leaks into the copy.
const TRANSLATION_EXAMPLES = `Examples of how to phrase findings (technical fact -> email sentence):
- "missing H1 heading" -> "Your homepage doesn't immediately tell new visitors what your business offers, which makes it harder for customers and Google to understand you."
- "slow LCP, 4.2s" -> "Your homepage takes longer than expected to appear, and some visitors may leave before they even see what you offer."
- "no phone number found" -> "I noticed customers can't easily find a phone number on your homepage, which may mean missed calls."
- "meta description missing" -> "Google is currently writing its own description of your business in search results, instead of the one you'd want customers to read."
- "CTA below the fold" -> "Your booking button is easy to miss, so visitors may not realize how simple it is to book with you."
- "viewport meta missing" -> "On phones the site is hard to use — and most local customers will be browsing on their phone."`;

const RULES = `Rules — follow every one:
- You are writing to a busy small business owner. Plain, simple English.
- Never use technical jargon. Never mention: HTML, H1, LCP, Lighthouse, meta tags, viewport, scores, percentages, or the word "audit tool".
- Every issue follows: problem -> business impact -> it's fixable.
- Sound like a real person, never like AI. No buzzwords, no hype, no "I hope this finds you well".
- Never exaggerate and never guarantee results — use "may", "could", "often".
- Personalized greeting: use the contact's first name if known, otherwise "Hi [business name] team,". Never "Hi there".
- Do not open with the score or a list of problems.`;

const FRAMEWORK = `Structure the message in exactly this order:
1. A genuine one-line compliment (use a listed strength; if none, compliment the business itself).
2. One sentence on why you looked at their website.
3. The 2-3 most important findings, woven in naturally.
4. What those may be costing them (use the revenue estimate softly if provided).
5. Reassure them everything is fixable, most of it quickly.
6. Offer something of value.
7. Close with the call to action.`;

// Returns outreach copy for one channel/style/CTA, or null when AI is unavailable/failed —
// the caller falls back to a template without caching it (same contract as generateFix).
export async function generateOutreach(context, { channel, style, cta }) {
  if (!aiAvailable()) return null;

  const prompt = `You write outreach for a freelance web consultant contacting a local business owner.
Write ${CHANNEL_FORMAT[channel]}
Writing style: ${STYLE_GUIDE[style]}

${RULES}

${TRANSLATION_EXAMPLES}

${FRAMEWORK}

For the call to action: ${CTA_INSTRUCTION[cta]}.

Context (already in business language — use it, don't invent facts):
${JSON.stringify(context)}
${context.mainProblems?.length ? '' : 'No audit data — keep claims generic and honest.'}
Return ONLY JSON: { "message": "..." }.`;

  try {
    return messageSchema.parse(await generateJson(prompt)).message;
  } catch (err) {
    logger.warn({ err, channel, style, cta }, 'AI outreach generation failed; using template fallback');
    return null;
  }
}
