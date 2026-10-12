'use client';

import { useState, useTransition } from 'react';
import { Pencil, Plus, Store as StoreIcon } from 'lucide-react';
import { formatSiret } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { saveStore, updateCompany, type CompanyInput, type StoreInput } from '../actions';

const card = 'flex flex-col gap-1 rounded-block border border-border bg-white p-5';
const row = 'flex justify-between gap-3 py-2 text-[13px]';

export function CompanyCard({
  companyId,
  siret,
  company,
  contact,
}: {
  companyId: string;
  siret: string;
  company: CompanyInput;
  contact: { name: string; email: string; phone: string };
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(company);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const set = (k: keyof CompanyInput) => (e: { target: { value: string } }) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  if (editing) {
    return (
      <section className={card}>
        <h2 className="mb-2 text-[16px] leading-[22px] font-semibold">Entreprise</h2>
        <div className="flex flex-col gap-3">
          <Field label="Raison sociale" value={v.legal_name} onChange={set('legal_name')} />
          <Field label="Adresse du siège" value={v.address} onChange={set('address')} />
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <Field
              label="Code postal"
              value={v.postal_code}
              onChange={set('postal_code')}
              inputMode="numeric"
              maxLength={5}
            />
            <Field label="Ville" value={v.city} onChange={set('city')} />
          </div>
          <Field label="Téléphone" value={v.phone} onChange={set('phone')} />
          {error && (
            <p role="alert" className="text-[13px] text-error">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              small
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await updateCompany(companyId, v);
                  if (r.error) setError(r.error);
                  else setEditing(false);
                })
              }
            >
              Enregistrer
            </Button>
            <Button
              small
              variant="secondary"
              onClick={() => {
                setV(company);
                setEditing(false);
                setError(undefined);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] leading-[22px] font-semibold">Entreprise</h2>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 text-[13px] font-medium"
        >
          Modifier
        </button>
      </div>
      <div className={row}>
        <span className="text-text-secondary">SIRET</span>
        <span className="text-right font-mono">{formatSiret(siret)}</span>
      </div>
      <div className={row}>
        <span className="text-text-secondary">Siège</span>
        <span className="text-right">
          {company.address}, {company.postal_code} {company.city}
        </span>
      </div>
      <div className={row}>
        <span className="text-text-secondary">Contact</span>
        <span className="text-right">{contact.name || '—'}</span>
      </div>
      <div className={row}>
        <span className="text-text-secondary">E-mail</span>
        <span className="text-right">{contact.email || '—'}</span>
      </div>
      <div className={row}>
        <span className="text-text-secondary">Téléphone</span>
        <span className="text-right">{company.phone || contact.phone || '—'}</span>
      </div>
    </section>
  );
}

interface StoreRow extends StoreInput {
  id: string;
  archived: boolean;
}
const EMPTY: StoreInput = { name: '', address: '', postal_code: '', city: '' };

export function StoresCard({ companyId, stores }: { companyId: string; stores: StoreRow[] }) {
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [v, setV] = useState<StoreInput>(EMPTY);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const set = (k: keyof StoreInput) => (e: { target: { value: string } }) =>
    setV((p) => ({ ...p, [k]: e.target.value }));
  const open = (id: string | 'new', s?: StoreInput) => {
    setEditing(id);
    setV(s ?? EMPTY);
    setError(undefined);
  };

  return (
    <section className={card}>
      <h2 className="mb-2 text-[16px] leading-[22px] font-semibold">Magasins associés</h2>
      {stores.map((s) =>
        editing === s.id ? null : (
          <div key={s.id} className="flex items-center gap-3 border-t border-divider py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-stone">
              <StoreIcon size={20} strokeWidth={1.6} aria-hidden />
            </span>
            <div className="flex min-w-0 grow flex-col">
              <span className="truncate text-[14px] font-medium">
                {s.name}
                {s.archived && (
                  <span className="ml-2 text-[12px] font-normal text-text-secondary">archivé</span>
                )}
              </span>
              <span className="truncate text-[12px] text-text-secondary">
                {s.address}, {s.postal_code} {s.city}
              </span>
            </div>
            <button
              type="button"
              aria-label={`Modifier ${s.name}`}
              onClick={() => open(s.id, s)}
              className="flex size-11 items-center justify-center rounded-control"
            >
              <Pencil size={16} strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        ),
      )}
      {editing ? (
        <div className="mt-2 flex flex-col gap-3 border-t border-divider pt-3">
          <Field label="Nom du magasin" value={v.name} onChange={set('name')} />
          <Field label="Adresse" value={v.address} onChange={set('address')} />
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <Field
              label="Code postal"
              value={v.postal_code}
              onChange={set('postal_code')}
              inputMode="numeric"
              maxLength={5}
            />
            <Field label="Ville" value={v.city} onChange={set('city')} />
          </div>
          {error && (
            <p role="alert" className="text-[13px] text-error">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              small
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await saveStore(companyId, editing === 'new' ? null : editing, v);
                  if (r.error) setError(r.error);
                  else setEditing(null);
                })
              }
            >
              Enregistrer
            </Button>
            <Button small variant="secondary" onClick={() => setEditing(null)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => open('new')}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-semibold"
        >
          <Plus size={16} strokeWidth={1.8} aria-hidden /> Associer un magasin
        </button>
      )}
    </section>
  );
}
