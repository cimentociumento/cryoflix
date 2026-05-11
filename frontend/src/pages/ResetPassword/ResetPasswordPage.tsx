import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { Button } from '../../shared/components/Button/Button';

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    try {
      await authService.resetPassword(token, password);
      navigate('/account', { state: { resetOk: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao redefinir');
    }
  };

  if (!token) {
    return (
      <div className="page-stack">
        <p>Token ausente.</p>
        <Link to="/account">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <h1>Nova senha</h1>
      <form className="login-form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="password">Nova senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirmar</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            required
            minLength={8}
          />
        </div>
        {error ? <span className="status error">{error}</span> : null}
        <Button type="submit">Salvar</Button>
      </form>
      <p>
        <Link to="/account">Cancelar</Link>
      </p>
    </div>
  );
};
