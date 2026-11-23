import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marquee active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100';

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-marquee text-bone hover:bg-marquee/85',
  secondary: 'border border-bone/20 text-bone hover:border-bone/40 hover:bg-bone/5',
  ghost: 'text-smoke hover:bg-bone/5 hover:text-bone',
};

export const Button = ({ variant = 'primary', icon, children, className, type, ...props }: ButtonProps) => (
  <button type={type ?? 'button'} className={`${BASE} ${VARIANTS[variant]} ${className ?? ''}`} {...props}>
    {icon}
    {children}
  </button>
);
