import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import ScoreGauge from '../../shared/components/ScoreGauge.jsx';
import SectionCard from './SectionCard.jsx';
import SaveLeadButton from '../leads/SaveLeadButton.jsx';

const SECTIONS = [
  ['performance', 'Performance'],
  ['seo', 'SEO'],
  ['accessibility', 'Accessibility'],
  ['security', 'Security'],
  ['conversion', 'Conversion'],
  ['ux', 'User Experience'],
];

export default function ReportView({ audit }) {
  const { user } = useAuth();

  if (audit.status === 'failed') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="mb-2 font-heading text-2xl font-semibold">We couldn’t analyze that site</h1>
        <p className="mb-6 text-secondary">
          We couldn’t load <span className="break-all">{audit.url}</span> — it may be down, blocking bots, or
          the address is wrong. Double-check it and try again.
        </p>
        <Link to="/" className="font-medium text-accent hover:underline">
          Try another website
        </Link>
      </div>
    );
  }

  const scores = audit.scores ?? {};
  const bySection = (key) => audit.findings.filter((f) => f.section === key);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-28">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-secondary">Audit report for</p>
        <h1 className="break-all font-heading text-xl font-semibold">{audit.url}</h1>
        <ScoreGauge score={scores.overall} size={220} />
        <p className="text-secondary">Overall score</p>
      </div>

      {audit.revenueEstimate?.high && (
        <div className="mx-auto mb-10 max-w-lg rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
          <p className="font-heading text-lg font-semibold">
            Estimated revenue opportunity: ${audit.revenueEstimate.low.toLocaleString()}–$
            {audit.revenueEstimate.high.toLocaleString()} / month
          </p>
          <p className="mt-1 text-xs text-secondary dark:text-secondary-dark">
            A rough estimate based on typical local-business traffic and your overall score — not a guarantee.
          </p>
        </div>
      )}

      {audit.screenshots?.desktop && (
        <div className="mb-10">
          <h2 className="mb-4 text-center font-heading text-lg font-semibold">How your website looks</h2>
          <div className="flex flex-wrap items-start justify-center gap-4">
            <img
              src={`data:image/jpeg;base64,${audit.screenshots.desktop}`}
              alt="Desktop view of the website"
              className="w-full max-w-md rounded-xl border border-secondary/20"
            />
            {audit.screenshots.mobile && (
              <img
                src={`data:image/jpeg;base64,${audit.screenshots.mobile}`}
                alt="Mobile view of the website"
                className="h-80 rounded-xl border border-secondary/20"
              />
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(([key, title]) => (
          <SectionCard key={key} title={title} score={scores[key]} findings={bySection(key)} auditId={audit._id} />
        ))}
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-secondary/15 bg-white/90 backdrop-blur dark:bg-[#1E1E1E]/90">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="text-sm font-medium text-accent hover:underline">
            New audit
          </Link>
          {user ? (
            <SaveLeadButton audit={audit} />
          ) : (
            <Link
              to="/register"
              state={{ from: `/audit/${audit._id}` }}
              className="text-sm font-medium text-accent hover:underline"
            >
              Create a free account to save this report
            </Link>
          )}
          {/* Streams the PDF from the server; the browser sends the auth cookie with the request. */}
          <a
            href={`/api/audits/${audit._id}/pdf`}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}
