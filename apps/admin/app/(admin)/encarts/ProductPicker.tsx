'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchProducts } from './actions';

export interface PickedProduct {
  id: string;
  reference: string;
  title: string;
}

/** Recherche de produits (titre, référence, EAN) avec sélection simple ou multiple. */
export function ProductPicker({
  selected,
  multiple,
  onChange,
}: {
  selected: PickedProduct[];
  multiple: boolean;
  onChange: (p: PickedProduct[]) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchProducts(q).then(setResults), 250);
    return () => clearTimeout(t);
  }, [q, open]);

  const pick = (p: PickedProduct) => {
    if (multiple) onChange(selected.some((s) => s.id === p.id) ? selected : [...selected, p]);
    else {
      onChange([p]);
      setOpen(false);
    }
    setQ('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <label className="flex h-10 items-center gap-2 rounded-control border border-border bg-white px-3 text-text-secondary">
          <Search size={18} strokeWidth={1.6} aria-hidden />
          <input
            type="search"
            aria-label="Rechercher un produit"
            placeholder="Titre, référence ou EAN"
            value={q}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            className="min-w-0 grow bg-transparent text-[14px] text-ink outline-none"
          />
        </label>
        {open && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-control border border-border bg-white shadow-popover"
          >
            {results.length === 0 && (
              <li className="px-3 py-2 text-[13px] text-text-secondary">Aucun produit.</li>
            )}
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected.some((s) => s.id === p.id)}
                  onClick={() => pick(p)}
                  className="flex min-h-11 w-full flex-col items-start px-3 py-1.5 text-left hover:bg-stone"
                >
                  <span className="text-[14px] font-medium">{p.title}</span>
                  <span className="font-mono text-[12px] text-text-secondary">{p.reference}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 w-full px-3 text-left text-[13px] font-medium"
              >
                Fermer
              </button>
            </li>
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <ul className="flex flex-col gap-1">
          {selected.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-control bg-stone px-3 py-1.5 text-[13px]"
            >
              <span className="min-w-0 grow truncate">
                <span className="font-mono text-text-secondary">{p.reference}</span> · {p.title}
              </span>
              <button
                type="button"
                aria-label={`Retirer ${p.title}`}
                onClick={() => onChange(selected.filter((s) => s.id !== p.id))}
                className="flex size-8 items-center justify-center"
              >
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
