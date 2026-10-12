import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'link';
  small?: boolean;
};

export function Button({ variant = 'primary', small, className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed';
  const styles = {
    primary:
      'rounded-control bg-ink px-4 text-white disabled:bg-disabled-bg disabled:text-disabled-text',
    secondary:
      'rounded-control border border-border-strong bg-white px-4 text-ink disabled:bg-disabled-bg disabled:text-disabled-text',
    link: 'min-h-11 bg-transparent font-medium text-ink underline underline-offset-3',
  }[variant];
  const height = variant === 'link' ? '' : small ? 'h-9' : 'h-10';
  return <button type="button" className={`${base} ${styles} ${height} ${className}`} {...props} />;
}
