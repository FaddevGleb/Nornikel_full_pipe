import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'neutral' | 'success' | 'warn';
}

const variants = {
  primary: 'ui-badge-primary',
  neutral: 'ui-badge-neutral',
  success: 'ui-badge-success',
  warn: 'ui-badge-warn',
};

export function Badge({ children, variant = 'primary' }: BadgeProps) {
  return <span className={`ui-badge ${variants[variant]}`}>{children}</span>;
}
