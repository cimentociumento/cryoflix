import type { HTMLAttributes } from 'react';

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'aside' | 'form' | 'article';
};

/** Superfície elevada padrão (velvet) para formulários, avisos e blocos de conteúdo. */
export const Panel = ({ as: Tag = 'div', className, ...props }: PanelProps) => (
  <Tag
    className={`rounded-xl border border-bone/10 bg-velvet p-5 sm:p-6 ${className ?? ''}`}
    {...props}
  />
);
