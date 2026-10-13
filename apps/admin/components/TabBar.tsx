'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Ellipsis,
  GalleryHorizontal,
  LayoutDashboard,
  LogOut,
  Package,
  Tag,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { signOut } from '@/app/connexion/actions';

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Tableau', icon: LayoutDashboard },
  { href: '/commandes', label: 'Commandes', icon: Package },
  { href: '/produits', label: 'Produits', icon: Tag },
  { href: '/clients', label: 'Clients', icon: Users },
];

/** Navigation du back-office sous 768 px (maquette AdminMobile) ; « Plus » ouvre Encarts et Déconnexion. */
export function TabBar({
  pendingRequests,
  newOrders,
  canManageTeam,
}: {
  pendingRequests: number;
  newOrders: number;
  canManageTeam: boolean;
}) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const item = (active: boolean) =>
    `relative flex h-[49px] flex-col items-center justify-center gap-0.5 text-[10px] ${
      active ? 'font-semibold text-ink' : 'font-medium text-text-secondary'
    }`;
  const moreActive = pathname.startsWith('/encarts') || pathname.startsWith('/equipe');
  return (
    <>
      {more && (
        <div className="fixed inset-0 z-30 md:hidden print:hidden" onClick={() => setMore(false)}>
          <div
            role="menu"
            aria-label="Plus"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 bottom-[calc(65px+env(safe-area-inset-bottom))] flex w-60 flex-col overflow-hidden rounded-block border border-border bg-white shadow-popover"
          >
            <Link
              role="menuitem"
              href="/encarts"
              onClick={() => setMore(false)}
              className="flex min-h-12 items-center gap-3 px-4 text-[14px] font-medium"
            >
              <GalleryHorizontal size={20} strokeWidth={1.6} aria-hidden />
              Encarts d’accueil
            </Link>
            <Link
              role="menuitem"
              href="/equipe"
              onClick={() => setMore(false)}
              className="flex min-h-12 items-center gap-3 border-t border-divider px-4 text-[14px] font-medium"
            >
              {canManageTeam ? (
                <UserCog size={20} strokeWidth={1.6} aria-hidden />
              ) : (
                <UserRound size={20} strokeWidth={1.6} aria-hidden />
              )}
              {canManageTeam ? 'Équipe' : 'Mon compte'}
            </Link>
            <form action={signOut} className="border-t border-divider">
              <button
                type="submit"
                role="menuitem"
                className="flex min-h-12 w-full items-center gap-3 px-4 text-[14px] font-medium"
              >
                <LogOut size={20} strokeWidth={1.6} aria-hidden />
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      )}
      <nav
        aria-label="Navigation du back-office"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-white px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden print:hidden"
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const n = href === '/clients' ? pendingRequests : href === '/commandes' ? newOrders : 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={item(active)}
            >
              <Icon size={22} strokeWidth={active ? 1.8 : 1.6} aria-hidden />
              {label}
              {n > 0 && (
                <span className="absolute top-0.5 left-1/2 ml-2 h-4 min-w-4 rounded-full bg-ink px-1 text-center text-[10px] leading-4 font-semibold text-white tabular-nums">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
          className={item(moreActive || more)}
        >
          <Ellipsis size={22} strokeWidth={moreActive ? 1.8 : 1.6} aria-hidden />
          Plus
        </button>
      </nav>
    </>
  );
}
