import { ReactNode } from 'react';

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export const Section = ({ title, description, children }: SectionProps) => (
  <section className="flex flex-col gap-4">
    <header>
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-smoke">{title}</h2>
      {description ? <p className="mt-1 text-sm text-smoke/70">{description}</p> : null}
    </header>
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [&>*]:w-[42vw] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-56">
      {children}
    </div>
  </section>
);

