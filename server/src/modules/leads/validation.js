import { z } from 'zod';
import { LEAD_STATUSES, OUTREACH_CHANNELS, OUTREACH_STYLES, OUTREACH_CTAS } from './model.js';

// Optional form fields arrive as '' when left blank — treat that as "not provided".
const blankAsUnset = (inner) => z.preprocess((v) => v || undefined, inner);

const leadFields = {
  businessName: z.string().trim().min(1, 'Business name is required').max(120),
  contactName: blankAsUnset(z.string().trim().max(120).optional()),
  email: blankAsUnset(z.string().trim().email('Enter a valid email').optional()),
  phone: blankAsUnset(z.string().trim().max(40).optional()),
  website: blankAsUnset(z.string().trim().max(300).optional()),
  auditId: blankAsUnset(z.string().length(24).optional()),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
  followUpAt: z.coerce.date().nullable().optional(),
};

export const createLeadSchema = z.object(leadFields);
export const updateLeadSchema = z.object({ ...leadFields, businessName: leadFields.businessName.optional() });
export const outreachSchema = z.object({
  channel: z.enum(OUTREACH_CHANNELS),
  style: z.enum(OUTREACH_STYLES).default('friendly'),
  cta: z.enum(OUTREACH_CTAS).default('reply'),
});
