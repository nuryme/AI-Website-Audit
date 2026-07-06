import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Input from '../../shared/components/Input.jsx';
import Button from '../../shared/components/Button.jsx';
import { createAudit } from './api.js';
import { auditFormSchema, normalizeUrl, INDUSTRY_OPTIONS } from './schemas.js';

export default function SubmitForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(auditFormSchema) });

  const mutation = useMutation({
    mutationFn: ({ url, industry }) => createAudit(url, industry),
    onSuccess: ({ auditId }) => navigate(`/audit/${auditId}`),
  });

  const onSubmit = ({ url, industry }) => mutation.mutate({ url: normalizeUrl(url), industry });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            id="url"
            placeholder="yourbusiness.com"
            aria-label="Website address"
            error={errors.url?.message}
            {...register('url')}
          />
        </div>
        <div className="sm:w-44">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Starting…' : 'Analyze Website'}
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="industry" className="mb-1 block text-sm text-secondary">
          What kind of business is it?
        </label>
        <select
          id="industry"
          className="w-full rounded-lg border border-secondary/30 bg-white px-3 py-2 text-sm dark:bg-white/5"
          {...register('industry')}
        >
          {INDUSTRY_OPTIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {mutation.isError && (
        <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">{mutation.error.message}</p>
      )}
    </form>
  );
}
