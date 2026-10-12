'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GalleryHorizontal,
  LayoutDashboard,
  LogOut,
  Package,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { signOut } from '@/app/connexion/actions';

const NAV: { href: string; label: string; icon: LucideIcon; built: boolean }[] = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard, built: false },
  { href: '/commandes', label: 'Commandes', icon: Package, built: false },
  { href: '/produits', label: 'Produits & stocks', icon: Tag, built: false },
  { href: '/clients', label: 'Clients', icon: Users, built: true },
  { href: '/encarts', label: 'Encarts d’accueil', icon: GalleryHorizontal, built: false },
];

export function Sidebar({ pendingRequests, name }: { pendingRequests: number; name: string }) {
  const pathname = usePathname();
  const itemBase = 'flex h-10 items-center gap-3 rounded-control border px-3 text-[14px]';
  return (
    <aside className="flex w-[248px] shrink-0 flex-col gap-7 border-r border-border bg-surface-alt px-4 py-5">
      <div className="flex items-center gap-2.5 px-2 py-1">
        <Image
          src="/logo-emd.jpg"
          alt="EMD DESTOCK"
          width={60}
          height={35}
          className="object-contain object-left mix-blend-multiply"
        />
        <span className="rounded-badge border border-border bg-white px-[7px] py-[3px] text-[11px] font-semibold tracking-[0.06em] text-text-secondary uppercase">
          Admin
        </span>
      </div>
      <nav aria-label="Navigation du back-office" className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon, built }) => {
          const active = built && pathname.startsWith(href);
          if (!built) {
            // Lots suivants (docs/PLAN.md) : visible mais inactif.
            return (
              <span
                key={href}
                aria-disabled="true"
                className={`${itemBase} cursor-not-allowed border-transparent font-medium text-disabled-text`}
              >
                <Icon size={20} strokeWidth={1.6} aria-hidden />
                <span className="grow">{label}</span>
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`${itemBase} ${active ? 'border-border bg-white font-semibold text-ink' : 'border-transparent font-medium text-text-body'}`}
            >
              <Icon size={20} strokeWidth={active ? 1.8 : 1.6} aria-hidden />
              <span className="grow">{label}</span>
              {href === '/clients' && pendingRequests > 0 && (
                <span className="h-5 min-w-5 rounded-full bg-ink px-1.5 text-center text-[11px] leading-5 font-semibold text-white tabular-nums">
                  {pendingRequests}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="grow" />
      <div className="flex items-center gap-2.5 border-t border-border px-2 pt-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <div className="flex min-w-0 grow flex-col">
          <span className="truncate text-[13px] font-semibold">{name}</span>
          <span className="text-[12px] text-text-secondary">Administrateur</span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Se déconnecter"
            className="flex size-11 items-center justify-center rounded-control text-text-secondary hover:text-ink"
          >
            <LogOut size={20} strokeWidth={1.6} aria-hidden />
          </button>
        </form>
      </div>
    </aside>
  );
}
