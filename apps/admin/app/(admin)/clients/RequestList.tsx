'use client';

import { useState, useTransition } from 'react';
import { BadgeCheck } from 'lucide-react';
import { formatSiret } from '@emd/shared';
import { Button } from '@/components/Button';
import { decideRequest } from './actions';

export interface SignupRequest {
  id: string;
  legalName: string;
  siret: string;
  address: string;
  contact: string;
  email: string;
  createdAt: string;
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
function ago(iso: string) {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return `Reçue ${rtf.format(minutes, 'minute')}`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `Reçue ${rtf.format(hours, 'hour')}`;
  return `Reçue ${rtf.format(Math.round(hours / 24), 'day')}`;
}

// Garde la liste initiale pour afficher le résultat de chaque décision (comme la maquette) sans faire disparaître la carte.
export function RequestList({ initial }: { initial: SignupRequest[] }) {
  const [items] = useState(initial); // instantané : la carte reste visible après la décision
  const [decisions, setDecisions] = useState<Record<string, 'active' | 'refused'>>({});
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function decide(id: string, status: 'active' | 'refused') {
    setError(undefined);
    start(async () => {
      const res = await decideRequest(id, status);
      if (res.error) setError(res.error);
      else setDecisions((d) => ({ ...d, [id]: status }));
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-[14px] text-text-secondary">Aucune demande d’inscription en attente.</p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-text-secondary">
        Le SIRET est contrôlé automatiquement via l’API Sirene de l’Insee. À la validation, le
        client reçoit un e-mail et peut se connecter à l’app.
      </p>
      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}
      {items.map((r) => {
        const decision = decisions[r.id];
        return (
          <article
            key={r.id}
            className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_280px] items-center gap-6 rounded-block border border-border bg-white p-5"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[16px] font-semibold">{r.legalName}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[13px]">{formatSiret(r.siret)}</span>
                <span className="inline-flex h-[22px] items-center gap-1 rounded-badge bg-success-bg px-2 text-[11px] font-semibold text-success-fg">
                  <BadgeCheck size={14} strokeWidth={2} aria-hidden />
                  Vérifié Sirene
                </span>
              </span>
              <span className="text-[13px] text-text-secondary">{r.address}</span>
            </div>
            <div className="flex flex-col gap-1 text-[13px]">
              <span className="font-medium">{r.contact}</span>
              <span className="text-text-secondary">{r.email}</span>
              <span className="text-text-secondary">{ago(r.createdAt)}</span>
            </div>
            <div className="flex justify-end gap-2">
              {decision ? (
                <span
                  className={`inline-flex h-10 items-center text-[14px] font-semibold ${decision === 'active' ? 'text-success-fg' : 'text-error'}`}
                >
                  {decision === 'active' ? 'Accès validé · e-mail envoyé' : 'Demande refusée'}
                </span>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => decide(r.id, 'refused')}
                  >
                    Refuser
                  </Button>
                  <Button disabled={pending} onClick={() => decide(r.id, 'active')}>
                    Valider l’accès
                  </Button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
