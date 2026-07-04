import type { ReactNode } from 'react';

interface ToastProps {
  message: string;
  children?: ReactNode;
  variant?: 'default' | 'warn';
}

export function Toast({ message, children, variant = 'default' }: ToastProps) {
  return (
    <div className={`ui-toast ui-toast-${variant}`} role="status" aria-live="polite">
      <span>{message}</span>
      {children}
    </div>
  );
}
