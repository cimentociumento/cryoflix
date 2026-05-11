import { Link } from 'react-router-dom';

export const UnauthorizedPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-cryo-danger)]">
      Não autorizado
    </h1>
    <p className="max-w-md text-neutral-400">Você não tem permissão para acessar esta área.</p>
    <Link to="/login" className="text-[var(--color-cryo-accent)] hover:underline">
      Voltar ao login
    </Link>
  </div>
);
