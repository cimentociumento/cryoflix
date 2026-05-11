import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { Button } from '../../shared/components/Button/Button';

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'err'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('err');
      setMessage('Token ausente na URL.');
      return;
    }
    void authService
      .verifyEmail(token)
      .then((r) => {
        setMessage(r.message);
        setStatus('ok');
      })
      .catch(() => {
        setMessage('Link inválido ou expirado.');
        setStatus('err');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="page-stack">
        <p>Verificando e-mail…</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <h1>Verificação de e-mail</h1>
      <p>{message}</p>
      {status === 'ok' ? (
        <Button onClick={() => (window.location.href = '/account')}>Ir para login</Button>
      ) : (
        <p>
          <Link to="/account">Voltar para a conta</Link>
        </p>
      )}
    </div>
  );
};
