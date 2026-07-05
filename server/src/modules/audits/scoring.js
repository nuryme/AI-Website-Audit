// Overall = weighted average of section scores. Weights are fixed constants (SYSTEM_DESIGN §3).
export const SECTION_WEIGHTS = {
  performance: 25,
  seo: 20,
  conversion: 20,
  accessibility: 15,
  security: 10,
  ux: 10,
};

const SEVERITY_PENALTY = { high: 25, medium: 12, low: 5 };

// A section starts at 100 and loses points per finding by severity. Deterministic and reproducible.
function scoreFromFindings(findings) {
  const penalty = findings.reduce((sum, f) => sum + (SEVERITY_PENALTY[f.severity] ?? 0), 0);
  return Math.max(0, 100 - penalty);
}

// findings: all findings; performanceScore: number|null (from PSI, overrides penalty scoring).
export function computeScores(findings, performanceScore) {
  const bySection = {};
  for (const section of Object.keys(SECTION_WEIGHTS)) {
    bySection[section] = findings.filter((f) => f.section === section);
  }

  const scores = {
    seo: scoreFromFindings(bySection.seo),
    accessibility: scoreFromFindings(bySection.accessibility),
    security: scoreFromFindings(bySection.security),
    conversion: scoreFromFindings(bySection.conversion),
    ux: scoreFromFindings(bySection.ux),
    // Performance is Lighthouse's own 0–100 score; null when PSI is unavailable.
    performance: performanceScore,
  };

  // Weighted average over sections that have a score; renormalize so a missing
  // performance score doesn't drag the overall down to zero.
  let weighted = 0;
  let totalWeight = 0;
  for (const [section, weight] of Object.entries(SECTION_WEIGHTS)) {
    if (scores[section] == null) continue;
    weighted += scores[section] * weight;
    totalWeight += weight;
  }
  scores.overall = totalWeight ? Math.round(weighted / totalWeight) : null;

  return scores;
}

// ---- M7: deterministic revenue-opportunity estimate ----
// Clearly-labeled rough range, no AI involved. All assumptions are named constants:
// a typical small local-business site and a baseline visitor→customer rate at a perfect score.
const ASSUMED_MONTHLY_VISITORS = 500;
const BASELINE_CONVERSION_RATE = 0.03;
// ponytail: linear "score gap ≈ lost conversions" model with a ±50% band — honest enough for a
// motivational estimate; plug in real traffic data (GA/GSC integration) if precision ever matters.
export function estimateRevenueOpportunity(overallScore, avgCustomerValue) {
  if (overallScore == null || overallScore >= 95) return null; // nothing meaningful to reclaim
  const gap = (100 - overallScore) / 100;
  const lostCustomersPerMonth = ASSUMED_MONTHLY_VISITORS * BASELINE_CONVERSION_RATE * gap;
  const mid = lostCustomersPerMonth * avgCustomerValue;
  const roundTo10 = (n) => Math.max(10, Math.round(n / 10) * 10);
  return { low: roundTo10(mid * 0.5), high: roundTo10(mid * 1.5) };
}
