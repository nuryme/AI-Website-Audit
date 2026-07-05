import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { registerSchema } from './schemas.js';
import Input from '../../shared/components/Input.jsx';
import Button from '../../shared/components/Button.jsx';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = (values) =>
    registerUser.mutate(values, { onSuccess: () => navigate('/', { replace: true }) });

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-secondary/20 p-6"
      >
        <h1 className="font-heading text-2xl font-semibold">Create your account</h1>

        {registerUser.isError && (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
            {registerUser.error.message}
          </p>
        )}

        <Input
          id="name"
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" disabled={registerUser.isPending}>
          {registerUser.isPending ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-sm text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
