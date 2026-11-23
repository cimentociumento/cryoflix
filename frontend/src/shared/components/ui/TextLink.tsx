import { Link, type LinkProps } from 'react-router-dom';

/** Link de texto padrão da interface. */
export const TextLink = ({ className, ...props }: LinkProps) => (
  <Link
    className={`text-sm font-medium text-bone underline decoration-bone/30 underline-offset-4 transition-colors hover:decoration-marquee focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marquee ${className ?? ''}`}
    {...props}
  />
);
