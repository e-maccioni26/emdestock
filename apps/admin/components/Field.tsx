import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  mono?: boolean;
};

export function Field({ label, error, mono, id, className = '', ...props }: Props) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-[13px] font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`h-11 rounded-control border bg-white md:h-10 px-3.5 text-[14px] outline-none focus:border-ink focus:shadow-[0_0_0_1px_#0a0a0a] ${
          error ? 'border-error' : 'border-border'
        } ${mono ? 'font-mono' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span id={`${fieldId}-error`} className="text-[13px] text-error">
          {error}
        </span>
      )}
    </div>
  );
}
