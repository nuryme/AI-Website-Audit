// Accessibility signals detectable from static HTML. (Lighthouse a11y score is merged in by the
// performance stage when a PSI key is present.)
export function checkAccessibility({ $ }) {
  const findings = [];
  const add = (checkId, severity, evidence) =>
    findings.push({ checkId, section: 'accessibility', severity, evidence });

  if (!$('html').attr('lang'))
    add('a11y-lang-missing', 'medium', 'The <html> tag has no lang attribute — screen readers cannot pick the right voice.');

  const imgs = $('img');
  const missingAlt = imgs.filter((_, el) => !$(el).attr('alt')?.trim()).length;
  if (missingAlt > 0)
    add('a11y-img-alt-missing', 'medium', `${missingAlt} of ${imgs.length} images lack alt text for screen readers.`);

  // Inputs with no associated label (no id+<label for>, no aria-label, not wrapped in a label).
  const unlabeled = $('input, select, textarea').filter((_, el) => {
    const $el = $(el);
    if ($el.attr('type') === 'hidden') return false;
    const id = $el.attr('id');
    const hasFor = id && $(`label[for="${id}"]`).length > 0;
    return !hasFor && !$el.attr('aria-label') && $el.closest('label').length === 0;
  }).length;
  if (unlabeled > 0)
    add('a11y-form-labels-missing', 'high', `${unlabeled} form field(s) have no accessible label.`);

  return findings;
}
