import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../../shared/components/Button/Button';
import { useAuth } from '../../../../app/providers/AuthProvider';

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

  return (
    <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
      <div className="login-form_toggle">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Entrar
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
        >
          Criar conta
        </button>
      </div>
      {mode === 'register' ? (
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          inputMode="email"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={MIN_PASSWORD_LENGTH}
        />
        {mode === 'register' ? (
          <small className="status">
            Mínimo 8 caracteres, maiúscula, minúscula, número e um de: !@#$%^&*
          </small>
        ) : null}
      </div>
      {mode === 'login' ? (
        <p className="field" style={{ marginTop: 0 }}>
          <Link to="/forgot-password">Esqueci minha senha</Link>
        </p>
      ) : null}
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Registrar'}
      </Button>
      {status === 'success' ? <span className="status success">Tudo pronto!</span> : null}
      {error ? <span className="status error">{error}</span> : null}
    </form>
  );
};

