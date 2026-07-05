import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAudit } from './api.js';
import Loader from '../../shared/components/Loader.jsx';
import ProgressView from './ProgressView.jsx';
import ReportView from './ReportView.jsx';

export default function AuditPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => getAudit(id),
    retry: false,
  });

  if (isLoading) return <Loader label="Loading your report…" />;

  if (isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="mb-4 text-secondary">{error.message}</p>
        <Link to="/" className="font-medium text-accent hover:underline">
          Start a new audit
        </Link>
      </div>
    );
  }

  const audit = data.audit;
  const running = audit.status === 'queued' || audit.status === 'running';
  // Pass the route id (matches the query key); the serialized audit has _id, not the `id` virtual.
  return running ? <ProgressView audit={audit} id={id} /> : <ReportView audit={audit} />;
}
