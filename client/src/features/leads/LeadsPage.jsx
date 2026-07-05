import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listLeads, createLead } from './api.js';
import { leadFormSchema } from './schemas.js';
import LeadCard from './LeadCard.jsx';
import Input from '../../shared/components/Input.jsx';
import Button from '../../shared/components/Button.jsx';
import Loader from '../../shared/components/Loader.jsx';

// M10: the outreach pipeline — leads added here or via "Save as lead" on a report.
export default function LeadsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['leads'], queryFn: listLeads });

  const { register, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(leadFormSchema),
  });
  const add = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const leads = data?.leads ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Your leads</h1>

      <form
        onSubmit={handleSubmit((values) => add.mutate(values))}
        className="mb-8 grid gap-3 rounded-2xl border border-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Input
          id="lead-business"
          label="Business name"
          placeholder="Bright Smile Dental"
          error={formState.errors.businessName?.message}
          {...register('businessName')}
        />
        <Input id="lead-contact" label="Contact name" placeholder="Dr. Rahman" {...register('contactName')} />
        <Input
          id="lead-email"
          label="Email"
          type="email"
          placeholder="owner@business.com"
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input id="lead-phone" label="Phone" placeholder="+880…" {...register('phone')} />
          </div>
          <Button type="submit" disabled={add.isPending} className="w-auto whitespace-nowrap py-2">
            {add.isPending ? 'Adding…' : 'Add lead'}
          </Button>
        </div>
        {add.isError && (
          <p className="text-sm text-accent sm:col-span-2 lg:col-span-4">{add.error.message}</p>
        )}
      </form>

      {isLoading ? (
        <Loader />
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-secondary/30 p-12 text-center">
          <p className="text-secondary">
            No leads yet. Add one above, or open an audit report and hit “Save as lead”.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {leads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))}
        </ul>
      )}
    </div>
  );
}
