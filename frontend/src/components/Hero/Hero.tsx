import type { ReactNode } from 'react';

type HeroProps = {
  title: string;
  description: string;
  eyebrow?: string;
  background?: string;
  cta?: ReactNode;
};

export const Hero = ({ title, description, eyebrow, background, cta }: HeroProps) => (
  <section
    className="relative flex min-h-[70vh] items-end overflow-hidden rounded-2xl border border-bone/10 bg-velvet bg-cover bg-center px-6 py-10 sm:px-12 sm:py-14"
    style={background ? { backgroundImage: `url(${background})` } : undefined}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" aria-hidden="true" />
    <div className="relative max-w-xl">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-smoke">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-4xl leading-[1.05] text-bone sm:text-5xl md:text-6xl">
        {title}
      </h1>
      <p className="mt-4 line-clamp-3 max-w-md text-smoke">{description}</p>
      {cta ? <div className="mt-8">{cta}</div> : null}
    </div>
  </section>
);
