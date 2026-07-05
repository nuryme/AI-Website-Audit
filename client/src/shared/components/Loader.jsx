export default function Loader({ label = 'Loading…' }) {
  return <div className="flex min-h-[40vh] items-center justify-center text-secondary">{label}</div>;
}
