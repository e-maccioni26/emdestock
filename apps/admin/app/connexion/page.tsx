import Image from 'next/image';
import { LoginForm } from './LoginForm';

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-alt px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-8 rounded-block border border-border bg-white p-8">
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/logo-emd.jpg"
            alt="EMD DESTOCK"
            width={168}
            height={98}
            priority
            className="object-contain"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em]">
              Back-office
            </h1>
            <p className="text-[15px] leading-[22px] text-text-secondary">
              Connectez-vous pour gérer les commandes, les produits et les clients.
            </p>
          </div>
        </div>
        <LoginForm
          initialError={erreur === 'acces' ? 'Ce compte n’a pas accès au back-office.' : undefined}
        />
      </div>
    </main>
  );
}
