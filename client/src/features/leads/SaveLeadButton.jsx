import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createLead } from './api.js';

const nameFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// One-click "save this audited site as a lead" on the report page (signed-in users).
// ponytail: no inline form — contact details get filled in on the Leads page.
export default function SaveLeadButton({ audit }) {
  const save = useMutation({
    mutationFn: () =>
      createLead({ businessName: nameFromUrl(audit.url), website: audit.url, auditId: audit._id }),
  });

  if (save.isSuccess) {
    return (
      <Link to="/leads" className="text-sm font-medium text-accent hover:underline">
        ✓ Saved — view leads
      </Link>
    );
  }

  return (
    <button
      onClick={() => save.mutate()}
      disabled={save.isPending}
      className="rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10 disabled:opacity-60"
    >
      {save.isPending ? 'Saving…' : 'Save as lead'}
    </button>
  );
}
