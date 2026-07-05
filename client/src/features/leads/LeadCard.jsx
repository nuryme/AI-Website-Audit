import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLead, deleteLead, getOutreach } from './api.js';
import { LEAD_STATUSES, OUTREACH_CHANNELS, STYLE_OPTIONS, CTA_OPTIONS } from './schemas.js';

const isDue = (followUpAt) => followUpAt && new Date(followUpAt) <= new Date();
// <input type="date"> wants yyyy-mm-dd
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

// One lead row: status pipeline + follow-up date inline, expands to contact details,
// notes, and the per-channel outreach generator (copy-paste — we never send messages).
export default function LeadCard({ lead }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [channel, setChannel] = useState(null);
  const [style, setStyle] = useState('friendly');
  const [cta, setCta] = useState('reply');
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? '');
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leads'] });
  const patch = useMutation({ mutationFn: (body) => updateLead(lead._id, body), onSuccess: invalidate });
  const del = useMutation({ mutationFn: () => deleteLead(lead._id), onSuccess: invalidate });
  const outreach = useMutation({
    mutationFn: (ch) => getOutreach(lead._id, ch, style, cta),
    onSuccess: invalidate, // AI copy is cached server-side; refresh so it survives collapse/reopen
  });

  const message = outreach.data?.message ?? (channel ? lead.outreach?.[channel]?.message : null);

  // Always ask the server: same style/CTA returns the cache for free, changed settings regenerate.
  const generate = (ch) => {
    setChannel(ch);
    setCopied(false);
    outreach.reset();
    outreach.mutate(ch);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
  };

  return (
    <li className="rounded-xl border border-secondary/20 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-medium">{lead.businessName}</span>
          <span className="text-xs text-secondary">
            {lead.website || lead.email || lead.phone || 'No contact details yet'}
          </span>
        </button>

        {isDue(lead.followUpAt) && lead.status !== 'won' && lead.status !== 'lost' && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
            Follow up due
          </span>
        )}

        <select
          value={lead.status}
          onChange={(e) => patch.mutate({ status: e.target.value })}
          aria-label={`Status of ${lead.businessName}`}
          className="rounded-lg border border-secondary/40 bg-white px-2 py-1 text-sm capitalize dark:border-secondary/30 dark:bg-white/5"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {confirming ? (
          <span className="flex items-center gap-1 text-xs">
            <button
              onClick={() => del.mutate()}
              className="rounded px-2 py-1 font-semibold text-accent hover:bg-accent/10"
            >
              Delete
            </button>
            <button onClick={() => setConfirming(false)} className="rounded px-2 py-1 text-secondary hover:bg-secondary/10">
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label={`Delete lead ${lead.businessName}`}
            className="rounded-lg px-2 py-1 text-sm text-secondary hover:bg-accent/10 hover:text-accent"
          >
            Delete
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-secondary/15 pt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-secondary dark:text-secondary-dark">
            {lead.contactName && <span>👤 {lead.contactName}</span>}
            {lead.email && <span>✉️ {lead.email}</span>}
            {lead.phone && <span>📞 {lead.phone}</span>}
            {lead.auditId && (
              <Link to={`/audit/${lead.auditId}`} className="font-medium text-accent hover:underline">
                View audit report
              </Link>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="font-heading font-medium">Follow up on</span>
            <input
              type="date"
              value={toDateInput(lead.followUpAt)}
              onChange={(e) => patch.mutate({ followUpAt: e.target.value || null })}
              className="rounded-lg border border-secondary/40 bg-white px-2 py-1 dark:border-secondary/30 dark:bg-white/5"
            />
          </label>

          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (lead.notes ?? '') && patch.mutate({ notes })}
              placeholder="Notes — calls, objections, next steps…"
              aria-label={`Notes for ${lead.businessName}`}
              rows={2}
              className="w-full rounded-lg border border-secondary/40 bg-white px-3 py-2 text-sm outline-none placeholder:text-secondary focus:border-accent dark:border-secondary/30 dark:bg-white/5"
            />
          </div>

          <div>
            <p className="mb-2 font-heading text-sm font-medium">Write my outreach</p>
            <div className="mb-2 flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-1.5">
                <span className="text-secondary dark:text-secondary-dark">Style</span>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="rounded-lg border border-secondary/40 bg-white px-2 py-1 dark:border-secondary/30 dark:bg-white/5"
                >
                  {STYLE_OPTIONS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-secondary dark:text-secondary-dark">Call to action</span>
                <select
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="rounded-lg border border-secondary/40 bg-white px-2 py-1 dark:border-secondary/30 dark:bg-white/5"
                >
                  {CTA_OPTIONS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {OUTREACH_CHANNELS.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => generate(id)}
                  disabled={outreach.isPending}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                    channel === id ? 'bg-primary text-[#1A1A1A]' : 'bg-secondary/10 hover:bg-secondary/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {outreach.isPending && <p className="mt-2 text-sm text-secondary">Writing your {channel} message…</p>}
            {outreach.isError && (
              <p className="mt-2 text-sm text-accent">Couldn’t write the message right now. Please try again.</p>
            )}
            {message && !outreach.isPending && (
              <div className="mt-3 rounded-lg bg-primary/10 p-3">
                <p className="whitespace-pre-wrap text-sm">{message}</p>
                <button onClick={copy} className="mt-2 text-xs font-semibold text-accent hover:underline">
                  {copied ? '✓ Copied' : 'Copy to clipboard'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
