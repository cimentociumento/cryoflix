import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type Form = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha no login');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-cryo-bg)] px-4">
      <div className="mb-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-cryo-accent)]">
          CryoFlix Admin
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Painel restrito a administradores</p>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-4 rounded-xl border border-[var(--color-cryo-border)] bg-[var(--color-cryo-panel)] p-6"
      >
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">E-mail</label>
          <input
            className="w-full rounded-md border border-[var(--color-cryo-border)] bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--color-cryo-accent)]"
            type="email"
            autoComplete="username"
            {...register('email')}
          />
          {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">Senha</label>
          <input
            className="w-full rounded-md border border-[var(--color-cryo-border)] bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--color-cryo-accent)]"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password ? <p className="mt-1 text-xs text-red-400">{errors.password.message}</p> : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[var(--color-cryo-accent)] py-2 text-sm font-semibold text-black hover:bg-[var(--color-cryo-accent-hover)] disabled:opacity-60"
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};
