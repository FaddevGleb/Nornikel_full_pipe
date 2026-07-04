import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  const textareaId = id ?? (label ? `textarea-${label.replace(/\s/g, '-')}` : undefined);
  return (
    <label className={`form-field ${className}`.trim()}>
      {label && <span className="form-label">{label}</span>}
      <textarea id={textareaId} className="form-textarea" {...props} />
    </label>
  );
}
