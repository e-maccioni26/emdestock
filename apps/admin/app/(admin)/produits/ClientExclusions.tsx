'use client';

import { useState } from 'react';

/** Visibilité par client : les cases cochées sont les clients pour lesquels le produit est masqué. */
export function ClientExclusions({
  clients,
  initial,
  active,
}: {
  clients: { id: string; name: string }[];
  initial: string[];
  active: boolean;
}) {
  const [picked, setPicked] = useState(() => new Set(initial));
  const [q, setQ] = useState('');
  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (!n.delete(id)) n.add(id);
      return n;
    });
  const match = (name: string) => name.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <section className="flex flex-col gap-3 rounded-block border border-border bg-white p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[16px] leading-[22px] font-semibold">Masquer pour certains clients</h2>
        <span className="text-[13px] text-text-secondary">
          {!active
            ? 'Sans effet : le produit est déjà masqué pour tous.'
            : picked.size === 0
              ? 'Aucun client exclu.'
              : `Masqué pour ${picked.size} client${picked.size > 1 ? 's' : ''}.`}
        </span>
      </div>
      {clients.length > 0 && (
        <>
          <input
            type="search"
            aria-label="Rechercher un client"
            placeholder="Rechercher un client"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 rounded-control border border-border bg-white px-3.5 text-[14px] outline-none focus:border-ink focus:shadow-[0_0_0_1px_#0a0a0a]"
          />
          <ul className="flex max-h-60 flex-col overflow-y-auto">
            {/* masqués par CSS (pas retirés) : une case cochée filtrée reste envoyée */}
            {clients.map((c) => (
              <li key={c.id} hidden={!match(c.name)}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[14px]">
                  <input
                    type="checkbox"
                    name="excluded"
                    value={c.id}
                    checked={picked.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="size-4 accent-ink"
                  />
                  {c.name}
                </label>
              </li>
            ))}
            {!clients.some((c) => match(c.name)) && (
              <li className="py-3 text-[13px] text-text-secondary">Aucun client trouvé.</li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
