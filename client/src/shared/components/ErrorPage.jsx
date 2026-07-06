import { Link } from 'react-router-dom';

export default function ErrorPage({
  title = 'Something went wrong',
  message = "We hit a snag loading this page. Let's get you back on track.",
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-3xl font-bold">{title}</h1>
      <p className="text-secondary dark:text-secondary-dark">{message}</p>
      <Link to="/" className="rounded-lg bg-accent px-4 py-2.5 font-heading font-semibold text-white transition hover:opacity-90">
        Back to home
      </Link>
    </div>
  );
}
