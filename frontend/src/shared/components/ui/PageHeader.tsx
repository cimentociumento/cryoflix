import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
};

/** Cabeçalho de página: título display + descrição curta + área opcional à direita. */
export const PageHeader = ({ title, description, aside }: PageHeaderProps) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="font-display text-3xl text-bone sm:text-4xl">{title}</h1>
      {description ? <p className="mt-1 text-sm text-smoke">{description}</p> : null}
    </div>
    {aside}
  </header>
);
