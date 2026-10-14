'use client';

import { useState, useTransition } from 'react';
import { useConfirm } from '@/components/ConfirmDialog';
import { changeOrderStatus } from '../actions';

export function CancelButton({ orderId }: { orderId: string }) {
  const confirm = useConfirm();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1 print:hidden">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (
            !(await confirm({
              title: 'Annuler cette commande ?',
              message:
                'Le stock de chaque ligne sera remis en stock, et la commande ne pourra plus changer de statut.',
              confirmLabel: 'Annuler la commande',
              cancelLabel: 'Retour',
              destructive: true,
            }))
          )
            return;
          setError(undefined);
          start(async () => setError((await changeOrderStatus(orderId, 'cancelled')).error));
        }}
        className="h-11 self-start text-[13px] font-medium text-error disabled:opacity-50"
      >
        Annuler la commande et remettre en stock
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}
    </div>
  );
}
