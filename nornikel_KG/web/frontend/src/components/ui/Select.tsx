import type { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, id, className = '', children, ...props }: SelectProps) {
  const selectId = id ?? (label ? `select-${label.replace(/\s/g, '-')}` : undefined);
  return (
    <label className={`form-field ${className}`.trim()}>
      {label && <span className="form-label">{label}</span>}
      <select id={selectId} className="form-select" {...props}>
        {children}
      </select>
    </label>
  );
}
