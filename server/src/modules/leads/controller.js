import { asyncHandler } from '../../utils/asyncHandler.js';
import { createLead, listLeads, updateLead, deleteLead, getOutreach } from './service.js';

export const create = asyncHandler(async (req, res) => {
  const lead = await createLead({ ...req.validated, userId: req.userId });
  res.status(201).json({ lead });
});

export const list = asyncHandler(async (req, res) => {
  const leads = await listLeads({ userId: req.userId });
  res.json({ leads });
});

export const update = asyncHandler(async (req, res) => {
  const lead = await updateLead({ id: req.params.id, userId: req.userId, ...req.validated });
  res.json({ lead });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteLead({ id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

export const outreach = asyncHandler(async (req, res) => {
  const message = await getOutreach({ id: req.params.id, userId: req.userId, ...req.validated });
  res.json({ message });
});
