import { ApiError } from '../../utils/ApiError.js';
import { validateAuditUrl } from '../../utils/ssrf.js';
import { logger } from '../../config/logger.js';
import { Audit } from './model.js';
import { runPipeline } from './pipeline.js';
import { generateFix } from '../ai/index.js';
import { FIX_FALLBACK } from '../ai/templates.js';
import { industryPack } from './industries.js';

// Ownership filter: a caller only ever sees their own audits (by userId or, if anonymous, anonId).
function ownerFilter({ userId, anonId }) {
  if (userId) return { userId };
  if (anonId) return { anonId };
  return { _id: null }; // no identity → matches nothing
}

export async function createAudit({ url, industry, userId, anonId }) {
  const safeUrl = await validateAuditUrl(url); // SSRF guard: throws ApiError on private/invalid

  const audit = await Audit.create({
    url: safeUrl,
    industry: industry ?? 'generic',
    userId: userId ?? null,
    anonId: anonId ?? null,
  });

  // Async, in-process — do NOT await; the request returns 202 immediately.
  runPipeline(audit.id).catch((err) => logger.error({ err, auditId: audit.id }, 'Pipeline rejected'));

  return audit;
}

export async function listAudits({ userId, anonId, search }) {
  const filter = ownerFilter({ userId, anonId });
  if (search) filter.url = { $regex: search, $options: 'i' };
  // ponytail: hard cap instead of pagination — revisit if anyone audits 100+ sites
  return Audit.find(filter).sort({ createdAt: -1 }).select('-findings -rawPsi -screenshots').limit(100).lean();
}

// `select` trims the payload for callers that don't need the heavy fields (screenshots, rawPsi).
export async function getAudit({ id, userId, anonId, select }) {
  const query = Audit.findOne({ _id: id, ...ownerFilter({ userId, anonId }) });
  if (select) query.select(select);
  const audit = await query;
  if (!audit) throw new ApiError(404, 'Audit not found.');
  return audit;
}

export async function deleteAudit({ id, userId, anonId }) {
  const res = await Audit.deleteOne({ _id: id, ...ownerFilter({ userId, anonId }) });
  if (res.deletedCount === 0) throw new ApiError(404, 'Audit not found.');
}

// M9: one-click AI fix for a single finding. Cached on the finding so repeat
// clicks (or other viewers) never re-spend AI budget.
export async function getFindingFix({ id, userId, anonId, checkId }) {
  const audit = await getAudit({ id, userId, anonId, select: '-screenshots -rawPsi' });
  const finding = audit.findings.find((f) => f.checkId === checkId);
  if (!finding) throw new ApiError(404, 'Finding not found on this audit.');
  if (finding.aiFix) return finding.aiFix;

  const aiFix = await generateFix(finding, {
    url: audit.url,
    industryLabel: industryPack(audit.industry).label,
  });
  if (aiFix) {
    // Only cache real AI output — a template fallback stays uncached so the
    // finding gets a proper fix once AI quota returns. Positional $ writes just this finding.
    await Audit.updateOne(
      { _id: audit._id, 'findings.checkId': checkId },
      { $set: { 'findings.$.aiFix': aiFix } },
    );
    return aiFix;
  }
  return finding.aiExplanation?.recommendation ?? FIX_FALLBACK;
}

export async function setFavorite({ id, userId, anonId, favorite }) {
  const audit = await Audit.findOneAndUpdate(
    { _id: id, ...ownerFilter({ userId, anonId }) },
    { favorite },
    { new: true },
  );
  if (!audit) throw new ApiError(404, 'Audit not found.');
  return audit;
}
