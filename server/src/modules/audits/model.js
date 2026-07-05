import mongoose from 'mongoose';

const aiExplanationSchema = new mongoose.Schema(
  {
    problem: String,
    impact: String,
    recommendation: String,
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    estimatedImprovement: String,
  },
  { _id: false },
);

const findingSchema = new mongoose.Schema(
  {
    checkId: { type: String, required: true },
    section: {
      type: String,
      enum: ['performance', 'seo', 'accessibility', 'security', 'conversion', 'ux'],
      required: true,
    },
    severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
    evidence: String, // what the check actually saw — plain text
    aiExplanation: aiExplanationSchema,
    aiFix: String, // M9: generated one-click fix, cached so repeat clicks don't re-spend AI budget
  },
  { _id: false },
);

const auditSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    industry: { type: String, default: 'generic' }, // M8: selects the rule pack (validated at the route)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    anonId: { type: String, default: null }, // hashed IP for anonymous audits
    status: {
      type: String,
      enum: ['queued', 'running', 'done', 'failed'],
      default: 'queued',
    },
    progress: {
      stage: { type: String, default: 'queued' },
      pct: { type: Number, default: 0 },
    },
    scores: {
      overall: Number,
      performance: Number,
      seo: Number,
      accessibility: Number,
      security: Number,
      conversion: Number,
      ux: Number,
    },
    findings: [findingSchema],
    // Base64 JPEGs from the headless render. ponytail: stored inline on the doc — fine for MVP;
    // move to object storage (or add cleanup) when Atlas free-tier storage gets tight.
    screenshots: {
      desktop: String,
      mobile: String,
      fullPage: String,
    },
    // M7: deterministic monthly revenue-opportunity range (USD); null when score is high or missing.
    revenueEstimate: {
      low: Number,
      high: Number,
    },
    rawPsi: mongoose.Schema.Types.Mixed, // trimmed PSI payload
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true },
);

auditSchema.index({ userId: 1, createdAt: -1 });
auditSchema.index({ anonId: 1 });

export const Audit = mongoose.model('Audit', auditSchema);

const anonQuotaSchema = new mongoose.Schema({
  ipHash: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
});

export const AnonQuota = mongoose.model('AnonQuota', anonQuotaSchema);
