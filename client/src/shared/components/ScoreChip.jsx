import { scoreBand, bandText } from '../utils/scoreBand.js';

// Small colored pill showing a 0–100 score (or — when unavailable).
export default function ScoreChip({ score }) {
  return (
    <span
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-sm font-semibold ${bandText[scoreBand(score)]}`}
    >
      {score ?? '—'}
    </span>
  );
}
