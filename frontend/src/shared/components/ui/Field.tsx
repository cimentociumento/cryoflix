import type { ReactNode } from 'react';

/** Classes compartilhadas por input, select e textarea. */
export const controlClassName =
  'w-full rounded-lg border border-bone/15 bg-ink px-3.5 py-2.5 text-sm text-bone placeholder:text-smoke/70 transition-colors hover:border-bone/30 focus:border-marquee focus:outline-none focus-visible:ring-2 focus-visible:ring-marquee/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]';

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
};

/** Label sempre visível + controle + dica opcional. */
export const Field = ({ label, htmlFor, hint, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-xs font-medium tracking-wide text-smoke">
      {label}
    </label>
    {children}
    {hint ? <small className="text-xs text-smoke/80">{hint}</small> : null}
  </div>
);
