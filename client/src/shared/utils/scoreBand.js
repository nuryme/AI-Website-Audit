// Score → color band. ≥80 good / 50–79 warn / <50 poor (UI_UX_SPEC §3.3).
export function scoreBand(score) {
  if (score == null) return 'na';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warn';
  return 'poor';
}

// Tailwind classes per band (built-in green/amber are theme tokens, not raw hex).
export const bandText = {
  good: 'text-green-600 dark:text-green-400',
  warn: 'text-amber-600 dark:text-amber-400',
  poor: 'text-accent',
  na: 'text-secondary',
};

// Recharts needs a fill string (SVG prop), so hex is unavoidable here. ponytail: three bands only.
export const bandHex = { good: '#16a34a', warn: '#f59e0b', poor: '#E91E63', na: '#7B7C68' };
