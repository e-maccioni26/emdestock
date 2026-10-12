'use client';

import { useState, useTransition } from 'react';
import { orderStatusLabel, type OrderStatus } from '@emd/shared';
import { StatusBadge } from '@/components/Badge';
import { changeOrderStatus } from '../actions';

const ORDER: OrderStatus[] = ['received', 'preparing', 'done', 'cancelled'];

export function StatusPanel({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const final = status === 'cancelled';

  function change(next: OrderStatus) {
    if (next === status || final) return;
    if (
      next === 'cancelled' &&
      !window.confirm(
        'Annuler cette commande ? Le stock de chaque ligne sera remis en stock, et la commande ne pourra plus changer de statut.',
      )
    )
      return;
    setError(undefined);
    start(async () => setError((await changeOrderStatus(orderId, next)).error));
  }

  return (
    <section className="flex flex-col gap-3 rounded-block border border-border bg-white p-5 print:hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] leading-[22px] font-semibold">Statut</h2>
        <StatusBadge status={status} />
      </div>
      <div role="radiogroup" aria-label="Changer le statut" className="flex flex-col gap-1.5">
        {ORDER.map((s) => {
          const on = s === status;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={pending || (final && !on)}
              onClick={() => change(s)}
              className={`flex h-11 items-center gap-2.5 rounded-control border px-3 text-left text-[14px] disabled:opacity-50 ${on ? 'border-ink font-semibold' : 'border-border font-medium'}`}
            >
              <span
                className={`size-4 rounded-full ${on ? 'border-[5px] border-ink' : 'border-[1.5px] border-border-strong'}`}
                aria-hidden
              />
              {orderStatusLabel(s)}
              {s === 'cancelled' && !on && !final && (
                <span className="ml-auto text-[12px] font-normal text-text-secondary">
                  remet en stock
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}
      <p className="text-[12px] leading-[17px] text-text-secondary">
        {final
          ? 'Commande annulée : le stock a été restitué, le statut est définitif.'
          : 'Le client voit le nouveau statut dans son historique de commandes.'}
      </p>
    </section>
  );
}
