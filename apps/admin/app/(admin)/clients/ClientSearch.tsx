'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function ClientSearch({ q }: { q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(q);
  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if (text.trim()) next.set('q', text.trim());
      else next.delete('q');
      router.replace(`${pathname}?${next.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <label className="flex h-11 items-center lg:h-10 lg:w-[340px] gap-2 rounded-control bg-stone px-3 text-text-secondary">
      <Search size={20} strokeWidth={1.6} aria-hidden />
      <input
        type="search"
        aria-label="Raison sociale, contact, SIRET"
        placeholder="Raison sociale, contact, SIRET"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-w-0 grow bg-transparent text-[14px] text-ink outline-none"
      />
    </label>
  );
}
