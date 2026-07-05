import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAudits, deleteAudit, setFavorite } from '../audit/api.js';
import ScoreChip from '../../shared/components/ScoreChip.jsx';
import Loader from '../../shared/components/Loader.jsx';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState(null); // inline two-step delete (no blocking dialog)
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['audits', search],
    queryFn: () => listAudits(search),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['audits'] });
  const del = useMutation({ mutationFn: deleteAudit, onSuccess: invalidate });
  const fav = useMutation({ mutationFn: ({ id, favorite }) => setFavorite(id, favorite), onSuccess: invalidate });

  const audits = data?.audits ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Your audits</h1>
        <Link to="/" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          New audit
        </Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by website…"
        aria-label="Search audits by website"
        className="mb-6 w-full rounded-lg border border-secondary/40 bg-white px-3 py-2 text-[#1a1a1a] outline-none placeholder:text-secondary focus:border-accent focus:ring-1 focus:ring-accent dark:border-secondary/30 dark:bg-white/5 dark:text-[#f5f5f5]"
      />

      {isLoading ? (
        <Loader />
      ) : audits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-secondary/30 p-12 text-center">
          <p className="mb-4 text-secondary">
            {search ? 'No audits match your search.' : 'You haven’t run any audits yet.'}
          </p>
          {!search && (
            <Link to="/" className="font-medium text-accent hover:underline">
              Run your first audit
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {audits.map((a) => (
            <li key={a._id} className="flex items-center gap-3 rounded-xl border border-secondary/20 p-3">
              <button
                onClick={() => fav.mutate({ id: a._id, favorite: !a.favorite })}
                aria-label={a.favorite ? 'Remove from favorites' : 'Add to favorites'}
                className="text-lg leading-none"
              >
                {a.favorite ? '⭐' : '☆'}
              </button>

              <Link to={`/audit/${a._id}`} className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.url}</span>
                <span className="text-xs text-secondary">{new Date(a.createdAt).toLocaleDateString()}</span>
              </Link>

              {a.status === 'done' ? (
                <ScoreChip score={a.scores?.overall} />
              ) : (
                <span className="text-xs capitalize text-secondary">{a.status}</span>
              )}

              {confirmId === a._id ? (
                <span className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => {
                      del.mutate(a._id);
                      setConfirmId(null);
                    }}
                    className="rounded px-2 py-1 font-semibold text-accent hover:bg-accent/10"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded px-2 py-1 text-secondary hover:bg-secondary/10"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmId(a._id)}
                  aria-label="Delete audit"
                  className="rounded-lg px-2 py-1 text-sm text-secondary hover:bg-accent/10 hover:text-accent"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
