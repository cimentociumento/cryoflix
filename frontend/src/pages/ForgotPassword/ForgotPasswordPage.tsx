import { useState, type FormEvent } from 'react';
import { authService } from '../../services/api/authService';
import { Button } from '../../shared/components/Button/Button';
import { Panel } from '../../shared/components/ui/Panel';
import { Field, controlClassName } from '../../shared/components/ui/Field';
import { Notice } from '../../shared/components/ui/Notice';
import { PageHeader } from '../../shared/components/ui/PageHeader';
import { TextLink } from '../../shared/components/ui/TextLink';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <PageHeader
        title="Esqueci minha senha"
        description="Informe seu e-mail para receber o link de redefinição."
      />
      {sent ? (
        <Notice tone="success">Se o e-mail existir, enviaremos as instruções em instantes.</Notice>
      ) : (
        <Panel as="form" className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field label="E-mail" htmlFor="email">
            <input
              id="email"
              type="email"
              className={controlClassName}
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              autoComplete="email"
              inputMode="email"
            />
          </Field>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Enviando...' : 'Enviar link'}
          </Button>
          {error ? <Notice tone="error">{error}</Notice> : null}
        </Panel>
      )}
      <TextLink to="/account" className="self-start">
        Voltar para o login
      </TextLink>
    </div>
  );
};
