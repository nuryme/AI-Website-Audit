// Business-language fallback explanations, keyed 1:1 to checkId. Used when Gemini is unavailable
// or over budget, so audits always complete. AI explanations, when available, replace these.
const TEMPLATES = {
  // SEO
  'seo-title-missing': {
    problem: 'Your homepage has no title.',
    impact: 'Google shows a blank or guessed title in search results, so fewer people click through to your site.',
    recommendation: 'Add a clear page title with your business name and what you offer, e.g. "Bright Smile Dental — Dentist in Austin, TX".',
  },
  'seo-title-length': {
    problem: 'Your page title is too short or too long.',
    impact: 'Google may cut it off or ignore it, making your search listing less compelling.',
    recommendation: 'Aim for a 10–60 character title that names your business and main service.',
  },
  'seo-meta-description-missing': {
    problem: 'Your homepage has no meta description.',
    impact: 'Google writes its own snippet for your search listing — often an unhelpful one that lowers clicks.',
    recommendation: 'Add a 1–2 sentence description of your business and location that invites people to visit.',
  },
  'seo-meta-description-length': {
    problem: 'Your meta description is too short or too long.',
    impact: 'Search engines truncate long descriptions and distrust very short ones, weakening your listing.',
    recommendation: 'Write a 50–160 character description highlighting what you offer and where.',
  },
  'seo-canonical-missing': {
    problem: 'Your page has no canonical tag.',
    impact: 'Search engines may treat duplicate versions of your page as separate, splitting your ranking.',
    recommendation: 'Add a canonical link tag pointing to the preferred URL of the page.',
  },
  'seo-og-tags-missing': {
    problem: 'Your page has no social sharing tags.',
    impact: 'When someone shares your site on Facebook or WhatsApp, it shows no image or preview — looking unprofessional.',
    recommendation: 'Add Open Graph tags (title, description, image) so shared links show an attractive preview.',
  },
  'seo-h1-missing': {
    problem: 'Your homepage has no main heading.',
    impact: 'Search engines and visitors can\'t immediately tell what your business does.',
    recommendation: 'Add one clear <h1> heading stating your main service and location.',
  },
  'seo-h1-multiple': {
    problem: 'Your homepage has several main headings.',
    impact: 'Multiple top-level headings confuse search engines about your page\'s main topic.',
    recommendation: 'Keep a single <h1> as the page\'s main heading and use <h2>/<h3> for the rest.',
  },
  'seo-img-alt-missing': {
    problem: 'Some images have no descriptive text.',
    impact: 'Search engines understand your images less effectively, reducing your visibility in image search.',
    recommendation: 'Add short alt text describing each meaningful image.',
  },
  'seo-robots-missing': {
    problem: 'No robots.txt file was found.',
    impact: 'Search engines have no guidance on what to crawl, which can waste crawl budget on unimportant pages.',
    recommendation: 'Add a robots.txt file at your site root, even a simple one that allows all.',
  },
  'seo-sitemap-missing': {
    problem: 'No sitemap.xml file was found.',
    impact: 'Search engines may take longer to discover all your pages.',
    recommendation: 'Publish a sitemap.xml listing your pages and reference it in robots.txt.',
  },
  'seo-broken-links': {
    problem: 'Some links on your homepage lead to missing pages.',
    impact: 'Visitors hit dead ends and search engines see a lower-quality site.',
    recommendation: 'Fix or remove the broken links so every link goes somewhere useful.',
  },
  // Accessibility
  'a11y-lang-missing': {
    problem: 'Your page doesn\'t declare its language.',
    impact: 'Screen readers may mispronounce your content for visitors with visual impairments.',
    recommendation: 'Add a lang attribute to the <html> tag, e.g. lang="en".',
  },
  'a11y-img-alt-missing': {
    problem: 'Some images have no alternative text.',
    impact: 'Visitors using screen readers can\'t tell what those images show.',
    recommendation: 'Add descriptive alt text to each meaningful image.',
  },
  'a11y-form-labels-missing': {
    problem: 'Some form fields have no labels.',
    impact: 'People using screen readers can\'t tell what to type, so they abandon your contact or booking form.',
    recommendation: 'Give every input a visible label or an aria-label.',
  },
  // Security
  'sec-https-missing': {
    problem: 'Your site isn\'t served securely over HTTPS.',
    impact: 'Browsers show a "Not Secure" warning that scares visitors away, and Google ranks you lower.',
    recommendation: 'Install an SSL certificate (most hosts offer free ones) and redirect HTTP to HTTPS.',
  },
  'sec-hsts-missing': {
    problem: 'Your site doesn\'t enforce secure connections.',
    impact: 'Visitors could be downgraded to an insecure connection on their first visit.',
    recommendation: 'Add a Strict-Transport-Security header to force HTTPS.',
  },
  'sec-csp-missing': {
    problem: 'Your site has no content security policy.',
    impact: 'Malicious scripts are easier to inject, putting your visitors\' data at risk.',
    recommendation: 'Add a Content-Security-Policy header restricting where scripts and styles can load from.',
  },
  'sec-x-frame-options-missing': {
    problem: 'Your site can be embedded in other websites.',
    impact: 'Attackers can frame your site to trick visitors into clicking hidden buttons (clickjacking).',
    recommendation: 'Add an X-Frame-Options or frame-ancestors policy to block framing.',
  },
  'sec-x-content-type-missing': {
    problem: 'Your site doesn\'t prevent content-type guessing.',
    impact: 'Browsers may misinterpret files in ways that can be exploited.',
    recommendation: 'Add the X-Content-Type-Options: nosniff header.',
  },
  'sec-mixed-content': {
    problem: 'Your secure page loads some insecure resources.',
    impact: 'Browsers block or warn about mixed content, breaking images or showing "Not Secure".',
    recommendation: 'Serve every image, script, and stylesheet over HTTPS.',
  },
  // Conversion
  'conv-cta-missing': {
    problem: 'There\'s no clear call-to-action on your homepage.',
    impact: 'Visitors don\'t know how to book, call, or contact you — so they leave without becoming customers.',
    recommendation: 'Add a prominent button like "Book an Appointment" or "Call Now" near the top of the page.',
  },
  'conv-cta-below-fold': {
    problem: 'Your main call-to-action is buried low on the page.',
    impact: 'Your booking or contact button is hidden — visitors leave before they scroll to it.',
    recommendation: 'Move a clear call-to-action button into the first screen visitors see.',
  },
  'conv-phone-missing': {
    problem: 'No phone number was found on your homepage.',
    impact: 'Local customers who prefer to call can\'t find your number and go to a competitor.',
    recommendation: 'Show your phone number prominently, ideally in the header, as a tappable link.',
  },
  'conv-trust-missing': {
    problem: 'Your homepage shows no proof that customers can trust you.',
    impact: 'Without reviews, credentials, or years in business, new visitors have no reason to pick you over a competitor.',
    recommendation: 'Add a few customer reviews, your credentials, or "serving the area since…" near the top of the page.',
  },
  'conv-form-missing': {
    problem: 'There\'s no contact or booking form on your homepage.',
    impact: 'Visitors who don\'t want to call have no easy way to reach you.',
    recommendation: 'Add a short contact or booking form so visitors can reach you in a few clicks.',
  },
  // UX
  'ux-viewport-missing': {
    problem: 'Your site isn\'t set up to adapt to phone screens.',
    impact: 'Most local customers browse on phones — a non-responsive site looks broken and drives them away.',
    recommendation: 'Add a responsive viewport meta tag and test your layout on mobile.',
  },
  'ux-favicon-missing': {
    problem: 'Your site has no favicon.',
    impact: 'Your browser tab shows a blank icon, making your site look less trustworthy and harder to find among tabs.',
    recommendation: 'Add a favicon with your logo or initials.',
  },
  // Performance
  'perf-unavailable': {
    problem: 'Performance data couldn\'t be measured this time.',
    impact: 'We couldn\'t assess load speed automatically for this audit.',
    recommendation: 'Re-run the audit later; if it persists, check that the site is publicly reachable.',
  },
  'perf-lcp': {
    problem: 'Your main content takes too long to appear.',
    impact: 'People are leaving your website before it finishes loading.',
    recommendation: 'Compress your largest images and reduce what loads first so the main content shows quickly.',
  },
  'perf-cls': {
    problem: 'Your page jumps around while it loads.',
    impact: 'Visitors misclick or get frustrated as content shifts, hurting trust and conversions.',
    recommendation: 'Set explicit sizes for images and ads so the layout stays stable while loading.',
  },
  'perf-tbt': {
    problem: 'Your page is slow to respond to taps and clicks.',
    impact: 'Visitors tap a button and nothing happens, so they assume the site is broken and leave.',
    recommendation: 'Reduce heavy scripts running on load so the page becomes interactive sooner.',
  },
};

const SEVERITY_IMPROVEMENT = {
  high: 'High — fixing this can noticeably increase enquiries.',
  medium: 'Moderate — a worthwhile improvement.',
  low: 'Minor — a small polish.',
};

// Build a complete aiExplanation for a finding from templates (no AI involved).
export function templateExplanation(finding) {
  const t = TEMPLATES[finding.checkId] ?? {
    problem: finding.evidence || 'An issue was detected.',
    impact: 'This may affect how visitors or search engines experience your site.',
    recommendation: 'Review this area of your site.',
  };
  return {
    ...t,
    priority: finding.severity ?? 'low',
    estimatedImprovement: SEVERITY_IMPROVEMENT[finding.severity] ?? SEVERITY_IMPROVEMENT.low,
  };
}

// Shown when AI can't produce a fix and the finding has no recommendation to fall back on.
export const FIX_FALLBACK = 'Review this area of your site and apply the recommended change.';

// ---- M10: outreach template fallbacks (used when Gemini is unavailable; never cached) ----
// Same framework as the AI prompt: compliment -> why I looked -> findings -> fixable -> CTA.

const CTA_LINES = {
  reply: 'Just reply to this message if you’d like the details.',
  'book-call': 'Would you be open to a quick 15-minute call?',
  'full-report': 'Happy to send over the full report of what I found — no strings attached.',
  'free-redesign': 'I’d be glad to put together a free redesign mockup of your homepage.',
  'free-consultation': 'I’d be happy to offer a free consultation if useful.',
  'free-audit-review': 'I’d be glad to walk you through everything I found, free.',
};

// Tone still varies without AI: greeting/sign-off flex per style so Friendly, Professional,
// CEO etc. don't all read identical while Gemini is unavailable.
const STYLE_GREETING = {
  friendly: (name, biz) => (name ? `Hey ${name},` : `Hey ${biz} team,`),
  professional: (name, biz) => (name ? `Dear ${name},` : `Dear ${biz} team,`),
  ceo: (name, biz) => (name ? `${name},` : `${biz} team,`),
  luxury: (name, biz) => (name ? `Dear ${name},` : `Dear ${biz} team,`),
  direct: (name, biz) => (name ? `${name} —` : `${biz} team —`),
  casual: (name, biz) => (name ? `Hey ${name}!` : `Hey ${biz} team!`),
};
const STYLE_SIGNOFF = {
  friendly: 'Cheers,',
  professional: 'Best regards,',
  ceo: '—',
  luxury: 'Warm regards,',
  direct: 'Thanks,',
  casual: 'Talk soon,',
};

export function outreachTemplate(context, { channel, style = 'friendly', cta = 'reply' } = {}) {
  const biz = context.businessName;
  const greeting = (STYLE_GREETING[style] ?? STYLE_GREETING.friendly)(context.contactName, biz);
  const signoff = STYLE_SIGNOFF[style] ?? STYLE_SIGNOFF.friendly;
  const compliment = context.strengths?.length
    ? `First off — ${context.strengths[0]}, which puts you ahead of many local businesses.`
    : `You’ve clearly put real care into ${biz}.`;
  const problems = context.mainProblems?.length
    ? `That said, I noticed a few things that may be costing you customers: ${context.mainProblems.join(' ')}`
    : 'That said, I noticed a few things on the site that may be costing you customers.';
  const ctaLine = CTA_LINES[cta] ?? CTA_LINES.reply;

  const templates = {
    email: `Subject: A few quick wins for ${biz}

${greeting}

${compliment} I came across your website while looking at local ${context.industry ?? 'business'} sites.

${problems}

The good news: all of it is fixable, most of it quickly. ${ctaLine}

${signoff}`,
    whatsapp: `${greeting} ${compliment} I had a look at your website and spotted a few things that may be costing you customers — all quickly fixable. ${ctaLine}`,
    linkedin: `${greeting} I looked at ${biz}'s website and found a few things that may be costing you customers — all fixable. ${ctaLine}`,
    proposal: `${greeting}

Proposal for ${biz}:

${context.mainProblems?.length ? context.mainProblems.map((p) => `- ${p}`).join('\n') : '- A review of your website found several issues affecting visitors and search ranking.'}

What I'd do: fix the issues above, verify the results, and send you a before/after report.

Investment: [price]

${ctaLine}`,
  };
  return templates[channel];
}
