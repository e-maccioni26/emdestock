'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/Button';
import { deleteClient, setFormerClient, setSuspended } from '../actions';

export function SuspendButton({ companyId, suspended }: { companyId: string; suspended: boolean }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3 print:hidden">
      {error && (
        <span role="alert" className="text-[13px] text-error">
          {error}
        </span>
      )}
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (
            !suspended &&
            !window.confirm(
              'Suspendre l’accès ? Le client perdra immédiatement l’accès au catalogue et aux commandes.',
            )
          )
            return;
          setError(undefined);
          start(async () => setError((await setSuspended(companyId, !suspended)).error));
        }}
      >
        {suspended ? 'Réactiver l’accès' : 'Suspendre l’accès'}
      </Button>
    </div>
  );
}

export function DeleteClientButton({ companyId }: { companyId: string }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              'Supprimer le compte client ? L’accès et les données personnelles (contact, téléphone, e-mail) seront effacés. Les commandes restent conservées. Action irréversible.',
            )
          )
            return;
          setError(undefined);
          start(async () => setError((await deleteClient(companyId))?.error));
        }}
        className="h-11 self-start text-[13px] font-medium text-error disabled:opacity-50"
      >
        Supprimer le compte client
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormerClientCheckbox({
  companyId,
  checked,
}: {
  companyId: string;
  checked: boolean;
}) {
  const [value, setValue] = useState(checked);
  const [pending, start] = useTransition();
  return (
    <label className="flex min-h-11 items-center gap-2.5 text-[14px] font-medium">
      <input
        type="checkbox"
        className="size-[18px] accent-ink"
        checked={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setValue(next);
          start(async () => {
            if ((await setFormerClient(companyId, next)).error) setValue(!next);
          });
        }}
      />
      Ancien client
    </label>
  );
}
