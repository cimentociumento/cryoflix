import { ReactNode } from 'react';

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export const Section = ({ title, description, children }: SectionProps) => (
  <section className="content-section">
    <header>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
    <div className="section-grid">{children}</div>
  </section>
);

