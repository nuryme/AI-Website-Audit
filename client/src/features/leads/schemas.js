import { z } from 'zod';

// Mirrors server/src/modules/leads/model.js (LEAD_STATUSES / OUTREACH_CHANNELS) — keep in sync.
export const LEAD_STATUSES = ['new', 'contacted', 'follow-up', 'replied', 'won', 'lost'];

export const OUTREACH_CHANNELS = [
  ['email', '✉️ Email'],
  ['whatsapp', '💬 WhatsApp'],
  ['linkedin', '💼 LinkedIn'],
  ['proposal', '📄 Proposal'],
];

export const STYLE_OPTIONS = [
  ['friendly', 'Friendly'],
  ['professional', 'Professional'],
  ['ceo', 'CEO'],
  ['luxury', 'Luxury'],
  ['direct', 'Direct'],
  ['casual', 'Casual'],
];

export const CTA_OPTIONS = [
  ['reply', 'Reply to this message'],
  ['book-call', 'Book a call'],
  ['full-report', 'Request full report'],
  ['free-redesign', 'Free homepage redesign'],
  ['free-consultation', 'Free consultation'],
  ['free-audit-review', 'Free audit review'],
];

export const leadFormSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required'),
  contactName: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
});
