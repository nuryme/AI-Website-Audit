// UX signals from static HTML (mobile-friendliness basics). Layout-shift/perf-driven UX comes
// from the performance stage when PSI is available.
export function checkUx({ $ }) {
  const findings = [];
  const add = (checkId, severity, evidence) =>
    findings.push({ checkId, section: 'ux', severity, evidence });

  const viewport = $('meta[name="viewport"]').attr('content') || '';
  if (!viewport.includes('width'))
    add('ux-viewport-missing', 'high', 'No responsive viewport meta tag — the site likely does not adapt to phones.');

  const favicon = $('link[rel~="icon"]').length > 0;
  if (!favicon) add('ux-favicon-missing', 'low', 'No favicon — the browser tab shows a blank icon.');

  return findings;
}
