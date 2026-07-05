import { ApiError } from '../../utils/ApiError.js';
import { Lead } from './model.js';
import { Audit } from '../audits/model.js';
import { generateOutreach } from '../ai/index.js';
import { outreachTemplate } from '../ai/templates.js';
import { industryPack } from '../audits/industries.js';

export async function createLead({ userId, ...fields }) {
  return Lead.create({ userId, ...fields });
}

export async function listLeads({ userId }) {
  // ponytail: hard cap instead of pagination — revisit if anyone tracks 200+ leads
  return Lead.find({ userId }).sort({ createdAt: -1 }).limit(200).lean();
}

export async function updateLead({ id, userId, ...fields }) {
  const lead = await Lead.findOneAndUpdate({ _id: id, userId }, fields, {
    new: true,
    runValidators: true,
  });
  if (!lead) throw new ApiError(404, 'Lead not found.');
  return lead;
}

export async function deleteLead({ id, userId }) {
  const res = await Lead.deleteOne({ _id: id, userId });
  if (res.deletedCount === 0) throw new ApiError(404, 'Lead not found.');
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

// Genuine compliments the email can open with, derived from what actually scored well.
const STRENGTH_PHRASES = {
  performance: 'the site loads nice and fast',
  seo: 'the site shows up well in search',
  accessibility: 'the site is easy for everyone to use',
  security: 'the site connection is properly secured',
  conversion: 'the path for customers to reach you is clear',
  ux: 'the site looks clean and modern',
};

// The Email Context Object: everything the writer needs, already in business language.
// mainProblems reuse the per-finding business translations (aiExplanation.problem) that the
// audit pipeline produced — the technical→business layer lives there, not in the prompt.
async function buildOutreachContext(lead) {
  const context = {
    businessName: lead.businessName,
    contactName: lead.contactName || null,
    website: lead.website || null,
    industry: industryPack(lead.industry).label,
  };
  if (!lead.auditId) return context;

  const audit = await Audit.findById(lead.auditId).select('scores findings revenueEstimate industry').lean();
  if (!audit) return context;

  const scores = audit.scores ?? {};
  return {
    ...context,
    industry: industryPack(audit.industry).label,
    overallScore: scores.overall ?? null,
    estimatedRevenueOpportunity: audit.revenueEstimate?.high
      ? `$${audit.revenueEstimate.low}–$${audit.revenueEstimate.high}/month`
      : null,
    mainProblems: [...(audit.findings ?? [])]
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .slice(0, 3)
      .map((f) => f.aiExplanation?.problem)
      .filter(Boolean),
    strengths: Object.entries(STRENGTH_PHRASES)
      .filter(([section]) => (scores[section] ?? 0) >= 90)
      .map(([, phrase]) => phrase)
      .slice(0, 2),
  };
}

// Outreach message for one channel/style/CTA. Cached on the lead keyed by settings —
// same settings return the cache; changed settings regenerate. Template fallback is
// never cached (same rule as audit fixes) so real AI copy lands once quota returns.
export async function getOutreach({ id, userId, channel, style, cta }) {
  const lead = await Lead.findOne({ _id: id, userId });
  if (!lead) throw new ApiError(404, 'Lead not found.');

  const cached = lead.outreach?.[channel];
  if (cached?.message && cached.style === style && cached.cta === cta) return cached.message;

  const context = await buildOutreachContext(lead);
  const message = await generateOutreach(context, { channel, style, cta });
  if (message) {
    await Lead.updateOne(
      { _id: id },
      { $set: { [`outreach.${channel}`]: { message, style, cta } } },
    );
    return message;
  }
  return outreachTemplate(context, { channel, cta });
}
