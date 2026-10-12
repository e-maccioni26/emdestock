'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const selectClass =
  'h-10 w-[200px] rounded-control border border-border bg-white px-3 text-[14px] text-ink';

export function ProductFilters({
  q,
  brand,
  category,
  brands,
  categories,
}: {
  q: string;
  brand: string;
  category: string;
  brands: { id: string; name: string }[];
  categories: { id: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(q);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`);
  };

  // Recherche différée : une requête après 300 ms sans frappe.
  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => update('q', text.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="flex items-center gap-3">
      <label className="flex h-10 w-[340px] items-center gap-2 rounded-control bg-stone px-3 text-text-secondary">
        <Search size={20} strokeWidth={1.6} aria-hidden />
        <input
          type="search"
          aria-label="Nom, référence ou code EAN"
          placeholder="Nom, référence ou code EAN"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 grow bg-transparent text-[14px] text-ink outline-none"
        />
      </label>
      <select
        aria-label="Marque"
        className={selectClass}
        value={brand}
        onChange={(e) => update('brand', e.target.value)}
      >
        <option value="">Toutes les marques</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Catégorie"
        className={selectClass}
        value={category}
        onChange={(e) => update('category', e.target.value)}
      >
        <option value="">Toutes les catégories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
