import { useState, type FormEvent } from 'react';
import { Button } from '../../../../shared/components/Button/Button';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { Field, controlClassName } from '../../../../shared/components/ui/Field';
import { Notice } from '../../../../shared/components/ui/Notice';
import { TextLink } from '../../../../shared/components/ui/TextLink';

const MIN_PASSWORD_LENGTH = 8;

export const LoginForm = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (value: string) => {
    if (value.length < MIN_PASSWORD_LENGTH) {
      return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
      return 'Use letras maiúsculas, minúsculas e números.';
    }
    if (!/[!@#$%^&*]/.test(value)) {
      return 'Inclua um caractere especial: !@#$%^&*';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setError(null);

    if (mode === 'register') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setStatus('error');
        setError(passwordError);
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Falha ao autenticar');
    }
  };

  const tab = (value: 'login' | 'register', label: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => {
        setMode(value);
        setError(null);
        setStatus('idle');
      }}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee ${
        mode === value ? 'bg-bone/10 text-bone' : 'text-smoke hover:text-bone'
      }`}
    >
      {label}
    </button>
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} autoComplete="on">
      <div className="flex gap-1 rounded-full border border-bone/10 bg-ink p-1">
        {tab('login', 'Entrar')}
        {tab('register', 'Criar conta')}
      </div>
      {mode === 'register' ? (
        <Field label="Nome" htmlFor="name">
          <input
            id="name"
            className={controlClassName}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </Field>
      ) : null}
      <Field label="E-mail" htmlFor="email">
        <input
          id="email"
          type="email"
          className={controlClassName}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          inputMode="email"
        />
      </Field>
      <Field
        label="Senha"
        htmlFor="password"
        hint={
          mode === 'register'
            ? 'Mínimo 8 caracteres, com maiúscula, minúscula, número e um de: !@#$%^&*'
            : undefined
        }
      >
        <input
          id="password"
          type="password"
          className={controlClassName}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={MIN_PASSWORD_LENGTH}
        />
      </Field>
      {mode === 'login' ? (
        <TextLink to="/forgot-password" className="self-start text-xs">
          Esqueci minha senha
        </TextLink>
      ) : null}
      <Button type="submit" disabled={status === 'loading'} className="w-full">
        {status === 'loading' ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Registrar'}
      </Button>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </form>
  );
};
