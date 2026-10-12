'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="text-[20px] font-semibold">Une erreur est survenue</h1>
      <p className="text-[14px] text-text-secondary">
        La page n’a pas pu se charger. Vérifiez votre connexion puis réessayez.
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-11 rounded-control bg-ink px-5 text-[14px] font-semibold text-white"
      >
        Réessayer
      </button>
    </main>
  );
}
