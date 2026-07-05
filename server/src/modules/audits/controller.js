import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  createAudit,
  listAudits,
  getAudit,
  deleteAudit,
  setFavorite,
  getFindingFix,
} from './service.js';
import { subscribeProgress } from './sse.js';
import { streamAuditPdf } from '../reports/pdf.js';

const identity = (req) => ({ userId: req.userId, anonId: req.anonId });

export const create = asyncHandler(async (req, res) => {
  const audit = await createAudit({ ...req.validated, ...identity(req) });
  res.status(202).json({ auditId: audit.id });
});

// M9: generate (or return the cached) one-click fix for a finding.
export const fix = asyncHandler(async (req, res) => {
  const text = await getFindingFix({ id: req.params.id, ...identity(req), checkId: req.validated.checkId });
  res.json({ fix: text });
});

export const list = asyncHandler(async (req, res) => {
  const audits = await listAudits({ ...identity(req), search: req.query.search });
  res.json({ audits });
});

export const getOne = asyncHandler(async (req, res) => {
  const audit = await getAudit({ id: req.params.id, ...identity(req) });
  res.json({ audit });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteAudit({ id: req.params.id, ...identity(req) });
  res.json({ ok: true });
});

export const favorite = asyncHandler(async (req, res) => {
  const audit = await setFavorite({ id: req.params.id, ...identity(req), favorite: req.validated.favorite });
  res.json({ audit });
});

// Stream a branded PDF of a finished audit. Ownership-scoped like getOne.
export const downloadPdf = asyncHandler(async (req, res) => {
  const audit = await getAudit({ id: req.params.id, ...identity(req) }); // 404s if not owned
  if (audit.status !== 'done') throw new ApiError(409, 'This report is not ready yet.');
  streamAuditPdf(audit, res);
});

// SSE progress stream. Authorizes ownership, replays current state, then streams updates until done/failed.
export const events = asyncHandler(async (req, res) => {
  // 404s if not owned; only progress/status are needed — skip the heavy fields (screenshots etc.)
  const audit = await getAudit({ id: req.params.id, ...identity(req), select: 'status progress' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Replay current state so a late subscriber (or a refresh) sees where the audit is now.
  send({ stage: audit.progress.stage, pct: audit.progress.pct, status: audit.status });

  if (audit.status === 'done' || audit.status === 'failed') return res.end();

  const unsubscribe = subscribeProgress(audit.id, (payload) => {
    send(payload);
    if (payload.status === 'done' || payload.status === 'failed') {
      unsubscribe();
      res.end();
    }
  });

  req.on('close', unsubscribe);
});
