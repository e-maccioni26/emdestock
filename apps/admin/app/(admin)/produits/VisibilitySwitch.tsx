'use client';

import { useOptimistic, useTransition } from 'react';
import { setVisibility } from './actions';

export function Switch({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative flex h-11 w-10 shrink-0 items-center justify-center`}
    >
      <span
        className={`relative block h-6 w-10 rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-border-strong'}`}
      >
        <span
          className={`absolute top-1 left-1 size-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
    </button>
  );
}

export function VisibilitySwitch({
  id,
  visible,
  title,
}: {
  id: string;
  visible: boolean;
  title: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(visible);
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={optimistic}
      disabled={pending}
      label={`${optimistic ? 'Masquer' : 'Afficher'} « ${title} » dans le catalogue`}
      onChange={(v) =>
        start(async () => {
          setOptimistic(v);
          await setVisibility(id, v);
        })
      }
    />
  );
}
