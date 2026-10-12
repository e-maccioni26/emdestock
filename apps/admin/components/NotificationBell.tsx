'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ShoppingBag, UserPlus } from 'lucide-react';
import { formatRelative } from '@emd/shared';
import { createClient } from '@/lib/supabase/browser';
import { markAllNotificationsRead, markNotificationRead } from '@/app/(admin)/notifications';

export interface Notification {
  id: string;
  type: string;
  ref_id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

const hrefOf = (n: Notification) =>
  n.type === 'new_order' ? `/commandes/${n.ref_id}` : '/clients';

/** Cloche du back-office : point rouge s'il y a des non-lues, panneau, mise à jour en direct (Supabase Realtime). */
export function NotificationBell({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const unread = items.some((n) => n.read_at === null);

  useEffect(() => setItems(initial), [initial]);

  // Nouvelles notifications en direct : on les ajoute, puis on rafraîchit les compteurs du menu.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    // On attend la session avant de s'abonner : un abonnement anonyme ne reçoit rien (RLS).
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session) return;
      supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel('admin-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
          (payload) => {
            setItems((prev) =>
              prev.some((n) => n.id === payload.new.id)
                ? prev
                : [payload.new as Notification, ...prev].slice(0, 20),
            );
            router.refresh(); // met à jour les compteurs du menu
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'admin_notifications' },
          (payload) => {
            setItems((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n)),
            );
          },
        )
        .subscribe();
    });
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onClick = (e: MouseEvent) => !panel.current?.contains(e.target as Node) && close();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, close]);

  return (
    <div ref={panel} className="absolute top-[18px] right-8 z-20 print:hidden">
      <button
        type="button"
        aria-label={unread ? 'Notifications, non lues' : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-10 items-center justify-center rounded-control border border-border bg-white text-ink"
      >
        <Bell size={20} strokeWidth={1.6} aria-hidden />
        {unread && (
          <span
            aria-hidden
            className="absolute top-2 right-[9px] size-2 rounded-full border-2 border-white bg-brand-red"
          />
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-[50px] right-0 w-[380px] overflow-hidden rounded-block border border-border bg-white shadow-popover"
        >
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[15px] font-semibold">Notifications</span>
            <button
              type="button"
              disabled={!unread}
              onClick={async () => {
                setItems((prev) =>
                  prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
                );
                await markAllNotificationsRead();
              }}
              className="min-h-11 text-[13px] font-medium disabled:text-disabled-text"
            >
              Tout marquer comme lu
            </button>
          </div>
          {items.length === 0 && (
            <p className="border-t border-divider px-4 py-6 text-center text-[13px] text-text-secondary">
              Aucune notification.
            </p>
          )}
          <ul className="max-h-[420px] overflow-auto">
            {items.map((n) => {
              const Icon = n.type === 'new_order' ? ShoppingBag : UserPlus;
              return (
                <li key={n.id}>
                  <Link
                    href={hrefOf(n)}
                    onClick={() => {
                      close();
                      if (n.read_at === null) {
                        setItems((prev) =>
                          prev.map((x) =>
                            x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
                          ),
                        );
                        markNotificationRead(n.id);
                      }
                    }}
                    className="flex gap-3 border-t border-divider px-4 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-stone">
                      <Icon size={18} strokeWidth={1.6} aria-hidden />
                    </span>
                    <span className="flex min-w-0 grow flex-col gap-0.5">
                      <span
                        className={`text-[14px] ${n.read_at === null ? 'font-semibold' : 'font-medium'}`}
                      >
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="truncate text-[13px] text-text-secondary">
                          {n.body.replace(/\b1 unités\b/, '1 unité')}
                        </span>
                      )}
                      <span className="text-[12px] text-text-secondary">
                        {formatRelative(n.created_at)}
                      </span>
                    </span>
                    {n.read_at === null && (
                      <span
                        aria-label="Non lue"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-red"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
