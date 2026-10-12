'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, Search } from 'lucide-react';

export const PERIODS = [
  ['7', '7 derniers jours'],
  ['30', '30 derniers jours'],
  ['90', '90 derniers jours'],
  ['365', '12 derniers mois'],
  ['all', 'Toute la période'],
] as const;

const box =
  'h-10 w-[200px] rounded-control border border-border bg-white px-3 text-[14px] text-ink';

export function OrderFilters({
  q,
  company,
  store,
  period,
  companies,
  stores,
}: {
  q: string;
  company: string;
  store: string;
  period: string;
  companies: { id: string; name: string }[];
  stores: { id: string; name: string; company_id: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(q);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`);
  };

  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => update({ q: text.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const visibleStores = company ? stores.filter((s) => s.company_id === company) : stores;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex h-10 w-[320px] items-center gap-2 rounded-control bg-stone px-3 text-text-secondary">
        <Search size={20} strokeWidth={1.6} aria-hidden />
        <input
          type="search"
          aria-label="N° de commande, client, magasin"
          placeholder="N° de commande, client, magasin"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 grow bg-transparent text-[14px] text-ink outline-none"
        />
      </label>
      <select
        aria-label="Client"
        className={box}
        value={company}
        onChange={(e) => update({ company: e.target.value, store: '' })}
      >
        <option value="">Tous les clients</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Magasin"
        className={box}
        value={store}
        onChange={(e) => update({ store: e.target.value })}
      >
        <option value="">Tous les magasins</option>
        {visibleStores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <label className="flex h-10 items-center gap-2 rounded-control border border-border bg-white px-3 text-[14px]">
        <Calendar size={20} strokeWidth={1.6} aria-hidden />
        <select
          aria-label="Période"
          value={period}
          onChange={(e) => update({ period: e.target.value })}
          className="bg-transparent outline-none"
        >
          {PERIODS.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
