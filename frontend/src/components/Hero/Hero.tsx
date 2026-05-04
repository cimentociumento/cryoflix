import { ReactNode } from 'react';

type HeroProps = {
  title: string;
  description: string;
  background?: string;
  cta?: ReactNode;
};

export const Hero = ({ title, description, background, cta }: HeroProps) => (
  <section
    className="hero-banner"
    style={{
      backgroundImage: background
        ? `linear-gradient(120deg, rgba(255, 255, 255, 0.92), rgba(232, 242, 255, 0.55)), url(${background})`
        : undefined,
    }}
  >
    <div>
      <p className="hero-pill">Streaming adaptativo</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="hero-cta">{cta}</div>
    </div>
  </section>
);

