import { useState } from 'react';
import ScoreChip from '../../shared/components/ScoreChip.jsx';
import FindingCard from './FindingCard.jsx';

// One audit section: score + finding count, expands to the findings list.
export default function SectionCard({ title, score, findings, auditId }) {
  const [open, setOpen] = useState(false);
  const count = findings.length;

  return (
    <div className="rounded-2xl border border-secondary/20 bg-neutral p-5 dark:bg-white/5">
      <button
        onClick={() => count && setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        disabled={count === 0}
      >
        <div>
          <h3 className="font-heading text-lg font-semibold">{title}</h3>
          <p className="text-sm text-secondary dark:text-secondary-dark">
            {count === 0 ? 'No issues found 🎉' : `${count} ${count === 1 ? 'issue' : 'issues'} to review`}
          </p>
        </div>
        <ScoreChip score={score} />
      </button>

      {open && count > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {findings.map((f, i) => (
            <FindingCard key={f.checkId + i} finding={f} auditId={auditId} />
          ))}
        </div>
      )}
    </div>
  );
}
