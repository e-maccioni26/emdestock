'use client';

import { useState, useTransition } from 'react';
import { changeOrderStatus } from '../actions';

export function CancelButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1 print:hidden">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              'Annuler cette commande ? Le stock de chaque ligne sera remis en stock, et la commande ne pourra plus changer de statut.',
            )
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
