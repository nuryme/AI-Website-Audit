import { Link } from 'react-router-dom';
import SubmitForm from './SubmitForm.jsx';

const STEPS = [
  ['1', 'Enter your URL', 'Paste your website address and hit analyze.'],
  ['2', 'We run the audit', 'We check performance, SEO, accessibility, security and more.'],
  ['3', 'Get your report', 'Plain-English fixes ranked by impact — download as a PDF.'],
];

export default function LandingPage() {
  return (
    <>
      {/* Hero — vertically centered, capped at one viewport tall so it never pushes content
          below the fold (dvh tracks mobile URL-bar resizing). */}
      <section className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-6 overflow-hidden bg-primary/20 px-4 py-6 text-center dark:bg-primary/10">
        <h1 className="font-heading text-4xl font-bold sm:text-5xl">Is your website losing customers?</h1>
        <p className="text-lg text-secondary dark:text-secondary-dark">Find out in less than 60 seconds.</p>
        <SubmitForm />
        <p className="text-xs text-secondary">
          Free, unlimited audits — no signup needed.{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>{' '}
          to save your reports as leads.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center font-heading text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(([n, title, body]) => (
            <li key={n} className="rounded-2xl border border-secondary/20 p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-heading font-bold text-[#1a1a1a]">
                {n}
              </div>
              <h3 className="mb-1 font-heading font-semibold">{title}</h3>
              <p className="text-sm text-secondary dark:text-secondary-dark">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
