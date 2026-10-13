'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { PERIODS } from '../commandes/OrderFilters';
import { ENTITY_LABELS } from './format';

const box =
  'h-11 w-full min-w-0 rounded-control border border-border bg-white px-3 text-[14px] text-ink lg:h-10 lg:w-[200px]';

export function JournalFilters({
  who,
  entity,
  period,
  people,
}: {
  who: string;
  entity: string;
  period: string;
  people: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const update = (key: string, v: string) => {
    const next = new URLSearchParams(window.location.search);
    if (v) next.set(key, v);
    else next.delete(key);
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`);
  };
  return (
    <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-3">
      <select
        aria-label="Personne"
        className={box}
        value={who}
        onChange={(e) => update('who', e.target.value)}
      >
        <option value="">Toutes les personnes</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Type d’élément"
        className={box}
        value={entity}
        onChange={(e) => update('entity', e.target.value)}
      >
        <option value="">Tous les éléments</option>
        {Object.entries(ENTITY_LABELS).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
      <label className="col-span-2 flex h-11 items-center gap-2 rounded-control border border-border bg-white px-3 text-[14px] lg:h-10">
        <Calendar size={20} strokeWidth={1.6} aria-hidden />
        <select
          aria-label="Période"
          value={period}
          onChange={(e) => update('period', e.target.value)}
          className="min-w-0 grow bg-transparent outline-none"
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
