import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getFindingFix } from './api.js';

const priorityStyle = {
  high: 'bg-accent/10 text-accent',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  low: 'bg-secondary/15 text-secondary dark:text-secondary-dark',
};

function PriorityBadge({ priority }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${priorityStyle[priority] ?? priorityStyle.low}`}
    >
      {priority}
    </span>
  );
}

// One finding in business language: Problem → Impact → Recommendation → Priority → Est. improvement.
// The raw technical evidence lives in a collapsible row.
export default function FindingCard({ finding, auditId }) {
  const [showDetails, setShowDetails] = useState(false);
  const ai = finding.aiExplanation ?? {};

  // One-click AI fix (M9): generated on demand, cached server-side on the finding.
  const fixMutation = useMutation({ mutationFn: () => getFindingFix(auditId, finding.checkId) });
  const fixText = fixMutation.data?.fix ?? finding.aiFix;

  return (
    <div className="rounded-xl border border-secondary/20 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="font-heading font-semibold">{ai.problem ?? 'Issue found'}</h4>
        {ai.priority && <PriorityBadge priority={ai.priority} />}
      </div>

      {ai.impact && (
        <p className="mb-2 text-sm text-secondary dark:text-secondary-dark">
          <span className="font-semibold">Why it matters: </span>
          {ai.impact}
        </p>
      )}
      {ai.recommendation && (
        <p className="mb-2 text-sm">
          <span className="font-semibold">What to do: </span>
          {ai.recommendation}
        </p>
      )}
      {ai.estimatedImprovement && (
        <p className="text-sm text-green-700 dark:text-green-400">
          <span className="font-semibold">Estimated improvement: </span>
          {ai.estimatedImprovement}
        </p>
      )}

      {auditId && (
        <div className="mt-3">
          {fixText ? (
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary dark:text-secondary-dark">
                Your AI-generated fix
              </p>
              <p className="whitespace-pre-wrap text-sm">{fixText}</p>
            </div>
          ) : (
            <button
              onClick={() => fixMutation.mutate()}
              disabled={fixMutation.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] hover:opacity-90 disabled:opacity-60"
            >
              {fixMutation.isPending ? 'Writing your fix…' : '✨ Get the fix'}
            </button>
          )}
          {fixMutation.isError && (
            <p className="mt-1 text-xs text-accent">Couldn’t generate a fix right now. Please try again.</p>
          )}
        </div>
      )}

      {finding.evidence && (
        <div className="mt-3">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs font-medium text-secondary hover:underline"
            aria-expanded={showDetails}
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>
          {showDetails && (
            <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-secondary/5 p-2 font-mono text-xs text-secondary dark:text-secondary-dark">
              {finding.evidence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
