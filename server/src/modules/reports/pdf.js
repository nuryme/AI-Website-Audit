import PDFDocument from 'pdfkit';

// Design tokens (UI_UX_SPEC §2). PDFKit needs color strings, so hex lives here.
const COLORS = {
  yellow: '#FFC107',
  pink: '#E91E63',
  olive: '#7B7C68',
  dark: '#1A1A1A',
  light: '#F1F1EC',
  good: '#16A34A',
  warn: '#F59E0B',
};

const SECTIONS = [
  ['performance', 'Performance'],
  ['seo', 'SEO'],
  ['accessibility', 'Accessibility'],
  ['security', 'Security'],
  ['conversion', 'Conversion'],
  ['ux', 'User Experience'],
];

// Score → band color, matching the client's ScoreGauge (≥80 good / 50–79 warn / <50 poor).
function bandColor(score) {
  if (score == null) return COLORS.olive;
  if (score >= 80) return COLORS.good;
  if (score >= 50) return COLORS.warn;
  return COLORS.pink;
}

function priorityColor(p) {
  if (p === 'high') return COLORS.pink;
  if (p === 'medium') return COLORS.warn;
  return COLORS.olive;
}

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'report';
  }
}

function sectionTitle(doc, text) {
  const left = doc.page.margins.left;
  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.dark).text(text, left, doc.y);
  doc
    .moveTo(left, doc.y + 3)
    .lineTo(left + 64, doc.y + 3)
    .lineWidth(3)
    .strokeColor(COLORS.yellow)
    .stroke();
  doc.moveDown(1);
}

function labelPara(doc, label, value, x, width) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.olive).text(label, x, doc.y, { width });
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.dark).text(value, x, doc.y, { width });
  doc.moveDown(0.35);
}

function buildCover(doc, audit) {
  const cx = doc.page.width / 2;
  const contentW = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.moveDown(3);
  doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.dark).text('InsightFlow AI', { align: 'center' });
  doc.font('Helvetica').fontSize(12).fillColor(COLORS.olive).text('Website Audit Report', { align: 'center' });

  doc.moveDown(3);

  // Overall score ring
  const score = audit.scores?.overall;
  const r = 72;
  const cy = doc.y + r;
  doc.lineWidth(7).strokeColor(bandColor(score)).circle(cx, cy, r).stroke();
  doc
    .font('Helvetica-Bold')
    .fontSize(50)
    .fillColor(COLORS.dark)
    .text(score != null ? String(score) : '—', cx - r, cy - 30, { width: r * 2, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.olive)
    .text('out of 100', cx - r, cy + 24, { width: r * 2, align: 'center' });

  doc.y = cy + r + 36;
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.dark).text(audit.url, doc.page.margins.left, doc.y, {
    width: contentW,
    align: 'center',
  });
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.olive)
    .text(
      new Date(audit.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      { align: 'center' },
    );
}

function image(doc, base64, boxW, boxH) {
  if (doc.y + boxH > doc.page.height - doc.page.margins.bottom) doc.addPage();
  doc.image(Buffer.from(base64, 'base64'), doc.page.margins.left, doc.y, { fit: [boxW, boxH] });
  doc.y += boxH + 14;
}

// "How your website looks" — desktop/mobile/full-page shots so the owner recognizes their own site.
// Skipped entirely (graceful) when the headless render was unavailable.
function buildScreenshots(doc, audit) {
  const s = audit.screenshots;
  if (!s || (!s.desktop && !s.mobile && !s.fullPage)) return;

  doc.addPage();
  sectionTitle(doc, 'How your website looks');
  const contentW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const caption = (t) => {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.olive).text(t, doc.page.margins.left, doc.y);
    doc.moveDown(0.3);
  };

  if (s.desktop) {
    caption('Desktop');
    image(doc, s.desktop, contentW, 300);
  }
  if (s.mobile) {
    caption('Mobile');
    image(doc, s.mobile, 210, 380);
  }
  if (s.fullPage) {
    doc.addPage();
    sectionTitle(doc, 'Full page');
    image(doc, s.fullPage, contentW, doc.page.height - doc.y - 60);
  }
}

function buildSummary(doc, audit) {
  doc.addPage();
  sectionTitle(doc, 'Score summary');

  const scores = audit.scores ?? {};
  const left = doc.page.margins.left;
  const labelW = 130;
  const barX = left + labelW;
  const barW = doc.page.width - doc.page.margins.right - barX - 40;
  let y = doc.y + 6;

  for (const [key, title] of SECTIONS) {
    const s = scores[key];
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.dark).text(title, left, y, { width: labelW });
    doc.roundedRect(barX, y, barW, 12, 6).fill(COLORS.light);
    if (s != null) doc.roundedRect(barX, y, Math.max(6, (s / 100) * barW), 12, 6).fill(bandColor(s));
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORS.dark)
      .text(s != null ? String(s) : 'N/A', barX + barW + 8, y, { width: 32 });
    y += 26;
  }
  doc.y = y;

  // M7: deterministic revenue-opportunity estimate, clearly labeled as a rough range.
  const rev = audit.revenueEstimate;
  if (rev?.high) {
    const w = doc.page.width - left - doc.page.margins.right;
    doc.moveDown(1.2);
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLORS.dark)
      .text(
        `Estimated revenue opportunity: $${rev.low.toLocaleString()}–$${rev.high.toLocaleString()} / month`,
        left,
        doc.y,
        { width: w },
      );
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.olive)
      .text(
        'A rough estimate based on typical local-business traffic and your overall score — not a guarantee.',
        left,
        doc.y + 4,
        { width: w },
      );
  }
}

function renderFinding(doc, f) {
  // Keep a finding from splitting awkwardly across the page bottom.
  if (doc.y > doc.page.height - 170) doc.addPage();

  const ai = f.aiExplanation ?? {};
  const left = doc.page.margins.left;
  const x = left + 12;
  const width = doc.page.width - x - doc.page.margins.right;
  const startY = doc.y;

  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.dark).text(ai.problem ?? 'Issue found', x, doc.y, { width });
  doc.moveDown(0.3);
  if (ai.impact) labelPara(doc, 'Why it matters', ai.impact, x, width);
  if (ai.recommendation) labelPara(doc, 'What to do', ai.recommendation, x, width);
  if (ai.estimatedImprovement) labelPara(doc, 'Estimated improvement', ai.estimatedImprovement, x, width);
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(priorityColor(ai.priority))
    .text(`${(ai.priority ?? 'low').toUpperCase()} PRIORITY`, x, doc.y, { width });

  // Left accent bar spanning the whole finding.
  doc
    .save()
    .lineWidth(3)
    .strokeColor(priorityColor(ai.priority))
    .moveTo(left + 3, startY)
    .lineTo(left + 3, doc.y)
    .stroke()
    .restore();

  doc.moveDown(1);
}

function buildSection(doc, key, title, audit) {
  doc.addPage();
  sectionTitle(doc, title);

  const score = audit.scores?.[key];
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(bandColor(score))
    .text(score != null ? `Score: ${score} / 100` : 'Score: N/A');
  doc.moveDown(0.6);

  const findings = (audit.findings ?? []).filter((f) => f.section === key);
  if (findings.length === 0) {
    doc.font('Helvetica').fontSize(12).fillColor(COLORS.good).text('No issues found. This section looks great.');
    return;
  }
  for (const f of findings) renderFinding(doc, f);
}

function addFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // avoid PDFKit auto-adding a page when writing near the bottom edge
    const y = doc.page.height - 34;
    const left = doc.page.margins.left;
    const w = doc.page.width - left - doc.page.margins.right;
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.olive);
    doc.text('Generated by InsightFlow AI', left, y, { width: w, align: 'left', lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, left, y, { width: w, align: 'right', lineBreak: false });
    doc.page.margins.bottom = oldBottom;
  }
}

// Stream a client-ready PDF audit report to `res`. Uses PDFKit's built-in Helvetica.
// ponytail: built-in fonts keep the server asset-free; register Poppins/Nunito TTFs later if brand type matters.
export function streamAuditPdf(audit, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="insightflow-${hostname(audit.url)}.pdf"`);
  doc.pipe(res);

  buildCover(doc, audit);
  buildScreenshots(doc, audit);
  buildSummary(doc, audit);
  for (const [key, title] of SECTIONS) buildSection(doc, key, title, audit);
  addFooters(doc);

  doc.end();
}
