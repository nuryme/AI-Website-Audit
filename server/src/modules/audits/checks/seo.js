// SEO signals from the parsed homepage + robots/sitemap presence. Deterministic; no network here.
export function checkSeo({ $, robotsFound, sitemapFound, brokenLinks }) {
  const findings = [];
  const add = (checkId, severity, evidence) =>
    findings.push({ checkId, section: 'seo', severity, evidence });

  const title = $('title').first().text().trim();
  if (!title) add('seo-title-missing', 'high', 'No <title> tag found.');
  else if (title.length < 10 || title.length > 60)
    add('seo-title-length', 'low', `Title is ${title.length} characters (ideal 10–60).`);

  const desc = $('meta[name="description"]').attr('content')?.trim() || '';
  if (!desc) add('seo-meta-description-missing', 'medium', 'No meta description tag found.');
  else if (desc.length < 50 || desc.length > 160)
    add('seo-meta-description-length', 'low', `Meta description is ${desc.length} characters (ideal 50–160).`);

  if (!$('link[rel="canonical"]').attr('href'))
    add('seo-canonical-missing', 'low', 'No canonical link tag found.');

  if ($('meta[property^="og:"]').length === 0)
    add('seo-og-tags-missing', 'low', 'No Open Graph tags — links shared on social show no preview.');

  const h1Count = $('h1').length;
  if (h1Count === 0) add('seo-h1-missing', 'high', 'No <h1> heading found.');
  else if (h1Count > 1) add('seo-h1-multiple', 'low', `Page has ${h1Count} <h1> headings; expected one.`);

  const imgs = $('img');
  const missingAlt = imgs.filter((_, el) => !$(el).attr('alt')?.trim()).length;
  if (missingAlt > 0)
    add('seo-img-alt-missing', 'medium', `${missingAlt} of ${imgs.length} images have no alt text.`);

  if (!robotsFound) add('seo-robots-missing', 'low', 'No robots.txt found at site root.');
  if (!sitemapFound) add('seo-sitemap-missing', 'low', 'No sitemap.xml found at site root.');

  if (brokenLinks?.length)
    add('seo-broken-links', 'medium', `${brokenLinks.length} internal link(s) return 404.`);

  return findings;
}
