import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { Button } from '../../shared/components/Button/Button';

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authService.verifyEmail(token),
    enabled: Boolean(token),
    retry: 0,
    refetchOnWindowFocus: false,
  });

  if (!token || isError) {
    return (
      <div className="page-stack">
        <h1>Verificação de e-mail</h1>
        <p>{!token ? 'Token ausente na URL.' : 'Link inválido ou expirado.'}</p>
        <p>
          <Link to="/account">Voltar para a conta</Link>
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <p>Verificando e-mail…</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <h1>Verificação de e-mail</h1>
      <p>{data?.message}</p>
      <Button onClick={() => (window.location.href = '/account')}>Ir para login</Button>
    </div>
  );
};
