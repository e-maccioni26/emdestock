'use client';

import { Printer } from 'lucide-react';

/** Impression du bon via window.print() : la feuille de style d'impression masque la navigation (SPEC §2). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-control border border-border-strong bg-white px-4 text-[14px] font-semibold print:hidden"
    >
      <Printer size={20} strokeWidth={1.6} aria-hidden />
      Imprimer le bon
    </button>
  );
}
