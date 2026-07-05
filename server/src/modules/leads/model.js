import mongoose from 'mongoose';

// M10: a saved prospect the user wants to pitch. Statuses form the outreach pipeline;
// followUpAt drives the "due" badge on the Leads page (no cron — computed client-side).
export const LEAD_STATUSES = ['new', 'contacted', 'follow-up', 'replied', 'won', 'lost'];
export const OUTREACH_CHANNELS = ['email', 'whatsapp', 'linkedin', 'proposal'];
// Writing-style and call-to-action options for outreach generation.
// Mirrored in client/src/features/leads/schemas.js — keep in sync.
export const OUTREACH_STYLES = ['friendly', 'professional', 'ceo', 'luxury', 'direct', 'casual'];
export const OUTREACH_CTAS = [
  'reply',
  'book-call',
  'full-report',
  'free-redesign',
  'free-consultation',
  'free-audit-review',
];

const leadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    contactName: String,
    email: String,
    phone: String,
    website: String,
    auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audit', default: null },
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    notes: String,
    followUpAt: Date,
    // AI-generated outreach cached per channel with the style/CTA it was written for —
    // a repeat request with the same settings is free; different settings regenerate.
    // Template fallbacks are never cached (same rule as audit fixes).
    outreach: {
      email: { message: String, style: String, cta: String },
      whatsapp: { message: String, style: String, cta: String },
      linkedin: { message: String, style: String, cta: String },
      proposal: { message: String, style: String, cta: String },
    },
  },
  { timestamps: true },
);

leadSchema.index({ userId: 1, createdAt: -1 });

export const Lead = mongoose.model('Lead', leadSchema);
