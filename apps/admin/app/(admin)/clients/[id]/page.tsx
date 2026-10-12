import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  formatDateLong,
  formatDayMonth,
  formatEuro,
  formatNumber,
  formatShortDateTime,
  toneColors,
  type OrderStatus,
} from '@emd/shared';
import { requireAdmin } from '@/lib/auth';
import { StatusBadge } from '@/components/Badge';
import { CompanyCard, StoresCard } from './EditCards';
import { DeleteClientButton, FormerClientCheckbox, SuspendButton } from './ClientControls';

const STATUS: Record<string, { label: string; tone: 'success' | 'neutral' | 'error' }> = {
  active: { label: 'Actif', tone: 'success' },
  suspended: { label: 'Suspendu', tone: 'neutral' },
  deleted: { label: 'Supprimé', tone: 'error' },
  pending: { label: 'En attente', tone: 'neutral' },
  refused: { label: 'Refusé', tone: 'error' },
};

export default async function ClientFiche({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: c }, { data: orders }] = await Promise.all([
    supabase
      .from('companies')
      .select(
        'id, legal_name, siret, address, postal_code, city, phone, status, is_former_client, validated_at, created_at, profiles(first_name, last_name, email, phone), stores(id, name, address, postal_code, city, archived_at, created_at)',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('orders')
      .select('id, number, created_at, total_ht, status, stores(name)')
      .eq('company_id', id)
      .order('created_at', { ascending: false }),
  ]);
  if (!c) notFound();

  const contact = c.profiles[0];
  const all = orders ?? [];
  const counted = all.filter((o) => o.status !== 'cancelled'); // les annulées sont exclues des indicateurs
  const total = counted.reduce((s, o) => s + o.total_ht, 0);
  const st = STATUS[c.status] ?? STATUS.active!;
  const tone = toneColors(st.tone);
  const initials = c.legal_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const stat = (label: string, value: string) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-text-secondary">{label}</span>
      <span className="text-[20px] font-semibold tabular-nums">{value}</span>
    </div>
  );
  const cols = 'lg:grid-cols-[128px_minmax(0,1fr)_minmax(0,1fr)_120px_140px]';
  const deleted = c.status === 'deleted';

  return (
    <>
      <header className="flex shrink-0 flex-col items-start gap-3 px-5 pt-1 pb-3 md:h-[76px] md:flex-row md:items-center md:border-b md:border-border md:py-0 md:pr-[88px] md:pl-8">
        <div className="flex min-w-0 max-w-full grow flex-col gap-0.5">
          <Link
            href="/clients?tab=actifs"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary"
          >
            <ChevronLeft size={14} strokeWidth={2} aria-hidden /> Clients
          </Link>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] md:truncate md:text-[20px] md:leading-[26px] md:tracking-[-0.01em]">
            {c.legal_name}
          </h1>
        </div>
        {!deleted && (c.status === 'active' || c.status === 'suspended') && (
          <SuspendButton companyId={c.id} suspended={c.status === 'suspended'} />
        )}
      </header>

      <div className="flex grow flex-col gap-4 px-5 pt-2 pb-6 md:gap-6 md:px-8 md:pt-7 md:pb-8">
        <section className="flex flex-col items-start gap-4 rounded-block border border-border bg-white p-4 md:p-6 lg:flex-row lg:items-center lg:gap-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-[18px] font-semibold text-white">
            {initials}
          </span>
          <div className="flex grow flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span className="text-[20px] font-semibold">{c.legal_name}</span>
              <span
                className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
                style={{ background: tone.bg, color: tone.fg }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: tone.dot }}
                  aria-hidden
                />
                {st.label}
              </span>
            </div>
            <span className="text-[13px] text-text-secondary">
              Client depuis le {formatDateLong(c.validated_at ?? c.created_at)}
              {c.validated_at ? ' · validé par EMD DESTOCK' : ''}
            </span>
          </div>
          <div className="flex w-full flex-wrap gap-x-8 gap-y-3 border-t border-border pt-4 lg:w-auto lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            {stat('Commandes', formatNumber(counted.length))}
            {stat('Total HT', formatEuro(total))}
            {stat('Dernière commande', counted[0] ? formatDayMonth(counted[0].created_at) : '—')}
          </div>
        </section>

        <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div
            role="table"
            aria-label="Historique des commandes"
            className="flex flex-col gap-2.5 lg:block lg:overflow-hidden lg:rounded-block lg:border lg:border-border lg:bg-white"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 lg:px-5 lg:pt-5 lg:pb-4">
              <h2 className="text-[16px] leading-[22px] font-semibold">Historique des commandes</h2>
              <span className="text-[12px] text-text-secondary">
                Indicateurs hors commandes annulées
              </span>
            </div>
            <div
              role="row"
              className={`hidden h-10 lg:grid ${cols} items-center gap-4 border-y border-border bg-surface-alt px-5 text-[12px] font-medium text-text-secondary`}
            >
              <span role="columnheader">N°</span>
              <span role="columnheader">Date</span>
              <span role="columnheader">Magasin</span>
              <span role="columnheader" className="text-right">
                Montant HT
              </span>
              <span role="columnheader">Statut</span>
            </div>
            {all.length === 0 && (
              <p className="px-5 py-10 text-center text-[14px] text-text-secondary">
                Aucune commande pour ce client.
              </p>
            )}
            {all.map((o) => (
              <Link
                key={o.id}
                role="row"
                href={`/commandes/${o.id}`}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-card border border-border px-4 py-3 lg:h-[52px] lg:gap-4 lg:rounded-none lg:border-0 lg:border-b lg:border-divider lg:px-5 lg:py-0 ${cols}`}
              >
                <span role="cell" className="font-mono text-[13px]">
                  {o.number}
                </span>
                <span
                  role="cell"
                  className="hidden text-[13px] text-text-body tabular-nums lg:block"
                >
                  {formatShortDateTime(o.created_at)}
                </span>
                <span role="cell" className="hidden truncate text-[14px] lg:block">
                  {o.stores?.name}
                </span>
                <span
                  role="cell"
                  className="text-right text-[14px] font-semibold tabular-nums max-lg:col-start-2 max-lg:row-start-2"
                >
                  {formatEuro(o.total_ht)}
                </span>
                <span
                  role="cell"
                  className="max-lg:col-start-2 max-lg:row-start-1 max-lg:justify-self-end"
                >
                  <StatusBadge status={o.status as OrderStatus} />
                </span>
                <span className="col-start-1 row-start-2 truncate text-[12px] text-text-secondary lg:hidden">
                  {o.stores?.name} · {formatShortDateTime(o.created_at)}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <CompanyCard
              companyId={c.id}
              siret={c.siret}
              company={{
                legal_name: c.legal_name,
                address: c.address,
                postal_code: c.postal_code,
                city: c.city,
                phone: c.phone ?? '',
              }}
              contact={{
                name: contact ? `${contact.first_name} ${contact.last_name}` : '',
                email: contact?.email ?? '',
                phone: contact?.phone ?? '',
              }}
            />
            <StoresCard
              companyId={c.id}
              stores={[...c.stores]
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
                .map((s) => ({
                  id: s.id,
                  name: s.name,
                  address: s.address,
                  postal_code: s.postal_code,
                  city: s.city,
                  archived: s.archived_at !== null,
                }))}
            />
            <section className="flex flex-col gap-2.5 rounded-block border border-border bg-white p-5">
              <h2 className="text-[16px] leading-[22px] font-semibold">Statut commercial</h2>
              <FormerClientCheckbox companyId={c.id} checked={c.is_former_client} />
              <span className="flex items-center gap-2 text-[12px] leading-[17px] text-text-secondary">
                <span className="h-5 shrink-0 rounded-badge bg-divider px-1.5 text-[11px] leading-5 font-semibold text-text-body">
                  V2
                </span>
                Servira aux tarifs préférentiels dans une prochaine version.
              </span>
            </section>
            {!deleted && <DeleteClientButton companyId={c.id} />}
          </div>
        </div>
      </div>
    </>
  );
}
