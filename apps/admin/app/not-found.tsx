import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-[20px] font-semibold">Page introuvable</h1>
      <p className="text-[14px] text-text-secondary">Cette page n’existe pas ou a été supprimée.</p>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-control bg-ink px-5 text-[14px] font-semibold text-white"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
