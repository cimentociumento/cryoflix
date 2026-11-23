import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { Button } from '../../shared/components/Button/Button';
import { Notice } from '../../shared/components/ui/Notice';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { TextLink } from '../../shared/components/ui/TextLink';

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authService.verifyEmail(token),
    enabled: Boolean(token),
    retry: 0,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader title="Verificação de e-mail" />
      {!token || isError ? (
        <>
          <Notice tone="error">{!token ? 'Token ausente na URL.' : 'Link inválido ou expirado.'}</Notice>
          <TextLink to="/account" className="self-start">
            Voltar para a conta
          </TextLink>
        </>
      ) : isLoading ? (
        <Notice>Verificando e-mail…</Notice>
      ) : (
        <>
          <Notice tone="success">{data?.message}</Notice>
          <Button className="self-start" onClick={() => navigate('/account')}>
            Ir para login
          </Button>
        </>
      )}
    </div>
  );
};
