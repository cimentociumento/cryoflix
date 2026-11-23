import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { Button } from '../../shared/components/Button/Button';
import { Panel } from '../../shared/components/ui/Panel';
import { Field, controlClassName } from '../../shared/components/ui/Field';
import { Notice } from '../../shared/components/ui/Notice';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { TextLink } from '../../shared/components/ui/TextLink';

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      navigate('/account', { state: { resetOk: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao redefinir');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <PageHeader title="Nova senha" />
        <Notice tone="error">Link sem token. Peça um novo e-mail de redefinição.</Notice>
        <TextLink to="/forgot-password" className="self-start">
          Pedir novo link
        </TextLink>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader title="Nova senha" description="Escolha uma senha nova para a sua conta." />
      <Panel as="form" className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Field label="Nova senha" htmlFor="password">
          <input
            id="password"
            type="password"
            className={controlClassName}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar senha" htmlFor="confirm">
          <input
            id="confirm"
            type="password"
            className={controlClassName}
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Panel>
      <TextLink to="/account" className="self-start">
        Cancelar
      </TextLink>
    </div>
  );
};
