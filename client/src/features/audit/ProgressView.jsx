import { motion, useReducedMotion } from 'framer-motion';
import { useAuditProgress } from './useAuditProgress.js';
import BalloonGame from './BalloonGame.jsx';

// Stage order matches server pipeline.js; active/complete derive from the server-sent stage key.
const STAGES = [
  { key: 'crawl', label: 'Loading your website' },
  { key: 'performance', label: 'Checking performance' },
  { key: 'seo', label: 'Analyzing SEO' },
  { key: 'accessibility', label: 'Checking accessibility' },
  { key: 'security', label: 'Checking security' },
  { key: 'conversion', label: 'Reviewing booking & conversion' },
  { key: 'vision', label: 'Looking at your design' },
  { key: 'ai', label: 'Writing your recommendations' },
];

// Button-style stage card with a progress line along its bottom border. The server only
// signals stage start/end (no mid-stage pct), so the active bar eases toward 90% and
// snaps to 100% when the stage completes; the whole card then turns green.
function StageButton({ label, state, reduce }) {
  const barWidth = state === 'done' ? '100%' : state === 'active' ? '90%' : '0%';
  return (
    <li
      className={`relative overflow-hidden rounded-xl border px-4 py-3 font-medium transition-colors ${
        state === 'done'
          ? 'border-green-500/40 bg-green-500/10'
          : state === 'active'
            ? 'border-accent/40'
            : 'border-secondary/20 text-secondary'
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        {label}
        {state === 'done' && <span className="text-green-600 dark:text-green-400">✓</span>}
      </span>
      <motion.span
        className={`absolute bottom-0 left-0 h-1 ${state === 'done' ? 'bg-green-500' : 'bg-accent'}`}
        initial={false}
        animate={{ width: barWidth }}
        transition={
          reduce
            ? { duration: 0 }
            : state === 'active'
              ? { duration: 10, ease: 'easeOut' } // creeps toward 90% while the server works
              : { duration: 0.35 }
        }
      />
    </li>
  );
}

export default function ProgressView({ audit, id }) {
  const reduce = useReducedMotion();
  const progress = useAuditProgress(id, {
    stage: audit.progress.stage,
    pct: audit.progress.pct,
    status: audit.status,
  });
  const pct = progress.pct;
  const done = progress.status === 'done';
  const activeIdx = STAGES.findIndex((s) => s.key === progress.stage);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      {!reduce && !done && <BalloonGame />}
      <h1 className="mb-2 text-center font-heading text-2xl font-semibold">Auditing your website</h1>
      <p className="mb-8 break-all text-center text-sm text-secondary">{audit.url}</p>

      <p className="mb-2 text-center font-heading text-4xl font-bold tabular-nums text-accent">{pct}%</p>

      <div className="mb-8 h-2 overflow-hidden rounded-full bg-secondary/15">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduce ? 0 : 0.4 }}
        />
      </div>

      <ul className="flex flex-col gap-3">
        {STAGES.map((s, i) => {
          const state = done || activeIdx > i ? 'done' : i === activeIdx ? 'active' : 'pending';
          return <StageButton key={s.key} label={s.label} state={state} reduce={reduce} />;
        })}
      </ul>

      {!reduce && !done && (
        <p className="mt-8 text-center text-sm text-secondary">While you wait — pop the balloons! 🎈</p>
      )}
    </div>
  );
}
