// Security posture from the response headers + page HTML. Deterministic.
export function checkSecurity({ finalUrl, headers, $ }) {
  const findings = [];
  const add = (checkId, severity, evidence) =>
    findings.push({ checkId, section: 'security', severity, evidence });

  const isHttps = finalUrl.startsWith('https://');
  if (!isHttps) add('sec-https-missing', 'high', 'Site is served over plain HTTP, not HTTPS.');

  const header = (name) => headers.get(name);

  if (isHttps && !header('strict-transport-security'))
    add('sec-hsts-missing', 'medium', 'No Strict-Transport-Security header.');
  if (!header('content-security-policy'))
    add('sec-csp-missing', 'medium', 'No Content-Security-Policy header.');
  if (!header('x-frame-options') && !header('content-security-policy'))
    add('sec-x-frame-options-missing', 'medium', 'No X-Frame-Options header — page can be framed for clickjacking.');
  if (!header('x-content-type-options'))
    add('sec-x-content-type-missing', 'low', 'No X-Content-Type-Options: nosniff header.');

  // Mixed content: an HTTPS page loading http:// scripts/styles/images.
  if (isHttps) {
    const mixed = $('[src^="http://"], [href^="http://"]').length;
    if (mixed > 0)
      add('sec-mixed-content', 'high', `${mixed} resource(s) loaded over insecure HTTP on an HTTPS page.`);
  }

  return findings;
}
