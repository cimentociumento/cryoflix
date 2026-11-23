import type { ReactNode } from 'react';

type NoticeProps = {
  tone?: 'info' | 'success' | 'error';
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

const TONES = {
  info: 'border-bone/10 text-smoke',
  success: 'border-gold/40 text-gold',
  error: 'border-marquee/50 text-bone',
} as const;

/** Mensagem de estado (sucesso, erro, informação) com ação opcional. */
export const Notice = ({ tone = 'info', children, action, className }: NoticeProps) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`flex flex-col items-start gap-3 rounded-lg border bg-velvet px-4 py-3 text-sm ${TONES[tone]} ${className ?? ''}`}
  >
    <div>{children}</div>
    {action}
  </div>
);
