import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
};

export const Button = ({ variant = 'primary', icon, children, ...props }: ButtonProps) => (
  <button className={`${styles.button} ${styles[variant]}`} {...props}>
    {icon}
    {children}
  </button>
);

