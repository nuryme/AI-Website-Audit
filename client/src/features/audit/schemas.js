import { z } from 'zod';

// Accept "example.com" or a full URL; normalize to https:// so the server's strict URL check passes.
export const normalizeUrl = (raw) => {
  const t = (raw ?? '').trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

// Mirrors server/src/modules/audits/industries.js (INDUSTRIES ids) — keep in sync.
export const INDUSTRY_OPTIONS = [
  ['generic', 'Local business'],
  ['dentist', 'Dental clinic'],
  ['restaurant', 'Restaurant'],
  ['salon', 'Salon / spa'],
];

export const auditFormSchema = z.object({
  url: z.string().trim().min(1, 'Enter your website address'),
  industry: z.enum(INDUSTRY_OPTIONS.map(([id]) => id)).default('generic'),
});
