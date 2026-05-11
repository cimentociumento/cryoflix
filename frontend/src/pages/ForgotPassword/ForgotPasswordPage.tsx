import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { Button } from '../../shared/components/Button/Button';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await authService.forgotPassword(email);
    setSent(true);
  };

  return (
    <div className="page-stack">
      <h1>Esqueci minha senha</h1>
      {sent ? (
        <p>Se o e-mail existir, enviaremos instruções em instantes.</p>
      ) : (
        <form className="login-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </div>
          <Button type="submit">Enviar</Button>
        </form>
      )}
      <p>
        <Link to="/account">Voltar</Link>
      </p>
    </div>
  );
};
