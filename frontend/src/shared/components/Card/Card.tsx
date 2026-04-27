import type { ReactNode } from 'react';
import styles from './Card.module.css';

type CardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export const Card = ({ title, subtitle, children }: CardProps) => (
  <article className={styles.card}>
    <h3 className={styles.title}>{title}</h3>
    {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    {children}
  </article>
);

