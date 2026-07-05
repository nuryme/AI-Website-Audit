// Deterministic conversion signals. The AI rubric judge (modules/ai) adds qualitative findings
// separately; all scoring stays in backend code.
const CTA_KEYWORDS = [
  'book', 'schedule', 'appointment', 'call', 'contact', 'get a quote', 'quote',
  'sign up', 'order', 'buy', 'reserve', 'get started', 'request',
];

const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;

// `pack` is the industry rule pack (M8): extra CTA keywords + expected trust signals as data.
export function checkConversion({ $ }, pack) {
  const findings = [];
  const add = (checkId, severity, evidence) =>
    findings.push({ checkId, section: 'conversion', severity, evidence });

  const ctaKeywords = [...CTA_KEYWORDS, ...(pack?.ctaKeywords ?? [])];

  // Treat buttons and prominent links as CTA candidates.
  const candidates = $('a, button').toArray();
  const ctaIndex = candidates.findIndex((el) => {
    const text = $(el).text().trim().toLowerCase();
    return text && ctaKeywords.some((kw) => text.includes(kw));
  });

  if (ctaIndex === -1) {
    add('conv-cta-missing', 'high', 'No clear call-to-action (book/call/contact/etc.) found on the page.');
  } else if (ctaIndex / candidates.length > 0.5) {
    // ponytail: DOM order is a cheap proxy for "below the fold" — real fold needs a rendered
    // viewport (Lighthouse/screenshot); good enough to flag CTAs buried deep in the markup.
    add('conv-cta-below-fold', 'medium', 'The main call-to-action appears low in the page, likely below the fold.');
  }

  const bodyText = $('body').text();
  if (!PHONE_RE.test(bodyText))
    add('conv-phone-missing', 'medium', 'No phone number detected on the homepage.');

  if ($('form').length === 0)
    add('conv-form-missing', 'low', 'No contact or booking form found on the homepage.');

  // Trust signals expected for this industry (reviews, credentials, awards…), matched as plain text.
  const trustSignals = pack?.trustSignals ?? [];
  const lowerBody = bodyText.toLowerCase();
  if (trustSignals.length && !trustSignals.some((kw) => lowerBody.includes(kw))) {
    add(
      'conv-trust-missing',
      'medium',
      `No trust signals found (looked for: ${trustSignals.join(', ')}).`,
    );
  }

  return findings;
}
