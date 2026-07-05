import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { loginSchema } from './schemas.js';
import Input from '../../shared/components/Input.jsx';
import Button from '../../shared/components/Button.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values) =>
    login.mutate(values, { onSuccess: () => navigate('/', { replace: true }) });

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-secondary/20 p-6"
      >
        <h1 className="font-heading text-2xl font-semibold">Welcome back</h1>

        {login.isError && (
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
            {login.error.message}
          </p>
        )}

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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-secondary">
          No account?{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
