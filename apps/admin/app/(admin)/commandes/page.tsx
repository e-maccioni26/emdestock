import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  formatEuro,
  formatNumber,
  formatRelative,
  formatShortDateTime,
  type OrderStatus,
} from '@emd/shared';
import { requireAdmin } from '@/lib/auth';
import { StatusBadge } from '@/components/Badge';
import { tabClass, tabCount, tabsWrap } from '@/components/tabs';
import { OrderFilters } from './OrderFilters';

const PAGE_SIZE = 10; // SPEC §2
const TABS: [string, string][] = [
  ['all', 'Toutes'],
  ['received', 'Reçues'],
  ['preparing', 'En préparation'],
  ['done', 'Traitées'],
  ['cancelled', 'Annulées'],
];

type Params = {
  tab?: string;
  q?: string;
  company?: string;
  store?: string;
  period?: string;
  page?: string;
};

export default async function Commandes({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : 'all';
  const period = sp.period ?? '30';
  const page = Math.max(1, Number(sp.page) || 1);
  const since = /^\d+$/.test(period)
    ? new Date(Date.now() - Number(period) * 86400_000).toISOString()
    : null;

  // Recherche : n° de commande, raison sociale ou nom de magasin (sans , ( ) qui casseraient le filtre PostgREST).
  const needle = (sp.q ?? '').replace(/[,()*%\\]/g, ' ').trim();
  let orFilter: string | null = null;
  if (needle) {
    const [{ data: cs }, { data: ss }] = await Promise.all([
      supabase.from('companies').select('id').ilike('legal_name', `%${needle}%`),
      supabase.from('stores').select('id').ilike('name', `%${needle}%`),
    ]);
    const parts = [`number.ilike.%${needle}%`];
    if (cs?.length) parts.push(`company_id.in.(${cs.map((c) => c.id).join(',')})`);
    if (ss?.length) parts.push(`store_id.in.(${ss.map((s) => s.id).join(',')})`);
    orFilter = parts.join(',');
  }
  const filtered = <
    T extends { eq(c: string, v: string): T; gte(c: string, v: string): T; or(f: string): T },
  >(
    q: T,
    status: string,
  ): T => {
    let r = q;
    if (orFilter) r = r.or(orFilter);
    if (sp.company) r = r.eq('company_id', sp.company);
    if (sp.store) r = r.eq('store_id', sp.store);
    if (since) r = r.gte('created_at', since);
    if (status !== 'all') r = r.eq('status', status);
    return r;
  };

  const counts = await Promise.all(
    TABS.map(([k]) =>
      filtered(supabase.from('orders').select('id', { count: 'exact', head: true }), k).then(
        (r: { count: number | null }) => r.count ?? 0,
      ),
    ),
  );
  const total = counts[TABS.findIndex(([k]) => k === tab)] ?? 0;
  const [{ data: rows }, { data: companies }, { data: stores }] = await Promise.all([
    filtered(
      supabase
        .from('orders')
        .select(
          'id, number, created_at, status, units, total_ht, viewed_at, companies(legal_name), stores(name), order_items(count)',
        ),
      tab,
    )
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase
      .from('companies')
      .select('id, legal_name')
      .in('status', ['active', 'suspended', 'deleted'])
      .order('legal_name'),
    supabase.from('stores').select('id, name, company_id').order('name'),
  ]);

  const href = (over: Partial<Params>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over }))
      if (v && !(k === 'page' && v === '1') && !(k === 'tab' && v === 'all')) p.set(k, v);
    const s = p.toString();
    return `/commandes${s ? `?${s}` : ''}`;
  };
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cols =
    'lg:grid-cols-[112px_104px_minmax(0,1.3fr)_minmax(0,1fr)_44px_56px_104px_132px_16px]';
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 px-5 pt-1 pb-3 md:h-[76px] md:border-b md:border-border md:py-0 md:pr-[88px] md:pl-8">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] md:text-[20px] md:leading-[26px] md:tracking-[-0.01em]">
            Commandes
          </h1>
          <p className="text-[13px] leading-[18px] text-text-secondary">
            {formatNumber(counts[1] ?? 0)} à traiter · {formatNumber(counts[0] ?? 0)} sur la période
          </p>
        </div>
      </header>
      <div className="flex grow flex-col gap-4 px-5 pt-2 pb-6 md:gap-6 md:px-8 md:pt-7 md:pb-8">
        <div role="tablist" className={tabsWrap}>
          {TABS.map(([k, label], i) => (
            <Link
              key={k}
              role="tab"
              aria-selected={tab === k}
              href={href({ tab: k, page: '1' })}
              className={tabClass(tab === k)}
            >
              {label}
              <span className={tabCount(tab === k)}>{formatNumber(counts[i] ?? 0)}</span>
            </Link>
          ))}
        </div>
        <OrderFilters
          q={sp.q ?? ''}
          company={sp.company ?? ''}
          store={sp.store ?? ''}
          period={period}
          companies={(companies ?? []).map((c) => ({ id: c.id, name: c.legal_name }))}
          stores={(stores ?? []).filter((st) =>
            (companies ?? []).some((c) => c.id === st.company_id),
          )}
        />
        <div
          role="table"
          aria-label="Commandes"
          className="flex flex-col gap-2.5 lg:block lg:overflow-hidden lg:rounded-block lg:border lg:border-border lg:bg-white"
        >
          <div
            role="row"
            className={`hidden h-11 lg:grid ${cols} items-center gap-3 border-b border-border bg-surface-alt px-5 text-[12px] font-medium text-text-secondary`}
          >
            <span role="columnheader">N°</span>
            <span role="columnheader">Date</span>
            <span role="columnheader">Client</span>
            <span role="columnheader">Magasin</span>
            <span role="columnheader" className="text-right">
              Réf.
            </span>
            <span role="columnheader" className="text-right">
              Unités
            </span>
            <span role="columnheader" className="text-right">
              Montant HT
            </span>
            <span role="columnheader">Statut</span>
            <span role="columnheader" />
          </div>
          {(rows ?? []).length === 0 && (
            <p className="px-6 py-12 text-center text-[14px] text-text-secondary">
              Aucune commande ne correspond à ces critères.
            </p>
          )}
          {(rows ?? []).map((r) => {
            const unseen = r.viewed_at === null;
            return (
              <Link
                key={r.id}
                role="row"
                href={`/commandes/${r.id}`}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-card border border-border px-4 py-3.5 lg:h-14 lg:rounded-none lg:border-0 lg:border-b lg:border-divider lg:px-5 lg:py-0 ${cols} ${unseen ? 'bg-surface-alt' : 'bg-white'}`}
              >
                <span
                  role="cell"
                  className={`flex items-center gap-2 font-mono text-[13px] ${unseen ? 'font-semibold' : ''}`}
                >
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${unseen ? 'bg-brand-red' : 'bg-transparent max-lg:hidden'}`}
                  />
                  {unseen && <span className="sr-only">Non consultée, </span>}
                  {r.number}
                </span>
                <span
                  role="cell"
                  className="hidden text-[13px] text-text-body tabular-nums lg:block"
                >
                  {formatShortDateTime(r.created_at)}
                </span>
                <span
                  role="cell"
                  className="col-start-1 row-start-2 truncate text-[15px] font-semibold lg:col-auto lg:row-auto lg:text-[14px] lg:font-medium"
                >
                  {r.companies?.legal_name}
                </span>
                <span role="cell" className="hidden truncate text-[14px] text-text-body lg:block">
                  {r.stores?.name}
                </span>
                <span role="cell" className="hidden text-right text-[14px] tabular-nums lg:block">
                  {r.order_items[0]?.count ?? 0}
                </span>
                <span role="cell" className="hidden text-right text-[14px] tabular-nums lg:block">
                  {r.units}
                </span>
                <span
                  role="cell"
                  className="col-start-2 row-span-2 row-start-2 self-end text-right text-[16px] font-semibold tabular-nums lg:col-auto lg:row-auto lg:self-auto lg:text-[14px]"
                >
                  {formatEuro(r.total_ht)}
                </span>
                <span
                  role="cell"
                  className="col-start-2 row-start-1 justify-self-end lg:col-auto lg:row-auto"
                >
                  <StatusBadge status={r.status as OrderStatus} />
                </span>
                <span className="col-start-1 row-start-3 text-[12px] leading-4 text-text-secondary lg:hidden">
                  {r.stores?.name} · {r.units} u. · {formatRelative(r.created_at)}
                </span>
                <ChevronRight
                  size={16}
                  strokeWidth={1.8}
                  className="hidden text-text-secondary lg:block"
                  aria-hidden
                />
              </Link>
            );
          })}
          <div className="flex h-14 items-center justify-between lg:px-5">
            <span className="text-[13px] text-text-secondary tabular-nums">
              {total === 0
                ? '0 commande'
                : `${from} à ${Math.min(page * PAGE_SIZE, total)} sur ${formatNumber(total)} commande${total > 1 ? 's' : ''}`}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={href({ page: String(page - 1) })}
                  className="inline-flex h-11 items-center rounded-control border border-border-strong lg:h-9 px-4 text-[14px] font-semibold"
                >
                  Précédent
                </Link>
              ) : (
                <span
                  aria-disabled
                  className="inline-flex h-11 items-center rounded-control border border-border-strong lg:h-9 px-4 text-[14px] font-semibold text-disabled-text"
                >
                  Précédent
                </span>
              )}
              {page < pages ? (
                <Link
                  href={href({ page: String(page + 1) })}
                  className="inline-flex h-11 items-center rounded-control border border-border-strong lg:h-9 px-4 text-[14px] font-semibold"
                >
                  Suivant
                </Link>
              ) : (
                <span
                  aria-disabled
                  className="inline-flex h-11 items-center rounded-control border border-border-strong lg:h-9 px-4 text-[14px] font-semibold text-disabled-text"
                >
                  Suivant
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
