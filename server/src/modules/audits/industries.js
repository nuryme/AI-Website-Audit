// Industry rule packs (M8): the audit engine stays industry-agnostic; industries are pure data.
// ctaKeywords extend the generic CTA list; trustSignals are checked against page text;
// avgCustomerValue (USD, first-visit value) feeds the deterministic revenue estimate.
// Industry ids are mirrored in client/src/features/audit/schemas.js (INDUSTRY_OPTIONS) — keep in sync.
export const INDUSTRIES = {
  generic: {
    label: 'local business',
    ctaKeywords: [],
    trustSignals: ['review', 'testimonial', 'guarantee', 'certified', 'years of experience', 'award'],
    avgCustomerValue: 80,
  },
  dentist: {
    label: 'dental clinic',
    ctaKeywords: ['new patients', 'emergency', 'free consultation'],
    trustSignals: ['review', 'testimonial', 'dds', 'insurance', 'certified', 'smile', 'patients'],
    avgCustomerValue: 250,
  },
  restaurant: {
    label: 'restaurant',
    ctaKeywords: ['menu', 'order online', 'delivery', 'takeaway', 'book a table'],
    trustSignals: ['review', 'tripadvisor', 'yelp', 'award', 'chef', 'since'],
    avgCustomerValue: 40,
  },
  salon: {
    label: 'salon / spa',
    ctaKeywords: ['book now', 'pricing', 'gift card'],
    trustSignals: ['review', 'testimonial', 'stylist', 'certified', 'award', 'before and after'],
    avgCustomerValue: 60,
  },
};

export const INDUSTRY_IDS = Object.keys(INDUSTRIES);

export const industryPack = (id) => INDUSTRIES[id] ?? INDUSTRIES.generic;
