import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAudit } from './api.js';

const isFinal = (status) => status === 'done' || status === 'failed';

// Live audit progress: SSE first, 2s polling fallback if the stream errors.
// State derives from the server, so a refresh mid-run resumes cleanly.
// When the audit finishes, invalidate the ['audit', id] query so the page swaps to the report.
export function useAuditProgress(id, initial) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(initial);

  useEffect(() => {
    let poll;
    let closed = false;

    const finish = (status) => {
      if (isFinal(status)) {
        queryClient.invalidateQueries({ queryKey: ['audit', id] });
      }
    };

    const startPolling = () => {
      if (poll || closed) return;
      poll = setInterval(async () => {
        try {
          const { audit } = await getAudit(id);
          if (closed) return;
          setProgress({ stage: audit.progress.stage, pct: audit.progress.pct, status: audit.status });
          if (isFinal(audit.status)) {
            clearInterval(poll);
            finish(audit.status);
          }
        } catch (err) {
          // err.status means the server actually responded (404/403/etc) — permanent, stop polling.
          // No status means a network blip — keep retrying.
          if (err.status) {
            clearInterval(poll);
            if (!closed) setProgress((p) => ({ ...p, error: err.message }));
          }
        }
      }, 2000);
    };

    const source = new EventSource(`/api/audits/${id}/events`, { withCredentials: true });

    source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setProgress(data);
      if (isFinal(data.status)) {
        source.close();
        finish(data.status);
      }
    };

    source.onerror = () => {
      source.close();
      startPolling(); // stream dropped → fall back to polling (self-terminates once done)
    };

    return () => {
      closed = true;
      source.close();
      if (poll) clearInterval(poll);
    };
  }, [id, queryClient]);

  return progress;
}
