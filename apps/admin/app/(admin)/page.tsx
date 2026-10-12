import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import {
  bucketLabel,
  deltaTone,
  formatDelta,
  formatEuro,
  formatNumber,
  formatRelative,
  percentChange,
  periodLabel,
  periodMonthLabel,
  tokens,
  toneColors,
  type AdminStats,
  type OrderStatus,
  type StatsPeriod,
} from '@emd/shared';
import { requireAdmin } from '@/lib/auth';
import { StatusBadge } from '@/components/Badge';
import { ProductImage } from '@/components/ProductImage';
import { OrdersChart } from './_dashboard/OrdersChart';

const PERIODS: [string, StatsPeriod, string][] = [
  ['semaine', 'week', 'Semaine'],
  ['mois', 'month', 'Mois'],
  ['annee', 'year', 'Année'],
];
const card = 'rounded-block border border-border bg-white p-6';

function Delta({ value, suffix }: { value: number | null; suffix?: string }) {
  const tone = deltaTone(value);
  const c =
    tone === 'up'
      ? toneColors('success')
      : tone === 'down'
        ? toneColors('error')
        : toneColors('neutral');
  return (
    <span
      className="inline-flex h-[22px] items-center rounded-badge px-2 text-[12px] font-semibold tabular-nums"
      style={{ background: c.bg, color: c.fg }}
    >
      {formatDelta(value, suffix)}
    </span>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  const [slug, period] = PERIODS.find(([k]) => k === sp.p) ?? PERIODS[1]!;
  const { supabase } = await requireAdmin();

  const [{ data, error }, { count: pending }, { data: latest }] = await Promise.all([
    supabase.rpc('admin_stats', { p_period: period }),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('orders')
      .select('id, number, status, total_ht, created_at, stores(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);
  const stats = data as unknown as AdminStats | null;
  const ids = stats?.top_products.map((p) => p.product_id) ?? [];
  const { data: images } = ids.length
    ? await supabase
        .from('products')
        .select('id, placeholder_shape, product_images(path, thumb_path, position)')
        .in('id', ids)
    : { data: [] };

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date());
  const kpis = stats
    ? [
        {
          label: 'Commandes reçues',
          v: formatNumber(stats.current.orders),
          d: percentChange(stats.current.orders, stats.previous.orders),
        },
        {
          label: 'Unités commandées',
          v: formatNumber(stats.current.units),
          d: percentChange(stats.current.units, stats.previous.units),
        },
        {
          label: 'Montant estimé HT',
          v: formatEuro(stats.current.total_ht),
          d: percentChange(stats.current.total_ht, stats.previous.total_ht),
        },
        {
          label: 'Clients actifs',
          v: formatNumber(stats.current.active_clients),
          d: stats.current.active_clients - stats.previous.active_clients,
          abs: true,
        },
      ]
    : [];
  const max = Math.max(1, ...(stats?.top_products.map((p) => p.units) ?? []));

  return (
    <>
      <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-border pr-[88px] pl-8">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h1 className="text-[20px] leading-[26px] font-semibold tracking-[-0.01em]">
            Tableau de bord
          </h1>
          <p className="text-[13px] leading-[18px] text-text-secondary">
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </p>
        </div>
        <div role="group" aria-label="Période" className="flex rounded-control bg-stone p-[3px]">
          {PERIODS.map(([k, , label]) => (
            <Link
              key={k}
              href={k === 'mois' ? '/' : `/?p=${k}`}
              aria-current={slug === k ? 'true' : undefined}
              className={`inline-flex h-[34px] items-center rounded-[8px] px-3.5 text-[13px] ${slug === k ? 'bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(10,10,10,0.08)]' : 'font-medium text-text-body'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      <div className="flex grow flex-col gap-6 px-8 pt-7 pb-8">
        {error || !stats ? (
          <p role="alert" className="text-[14px] text-error">
            Impossible de charger les statistiques. Rechargez la page.
          </p>
        ) : (
          <>
            {(pending ?? 0) > 0 && (
              <div
                className="flex items-center gap-3 rounded-card border py-3 pr-3 pl-4"
                style={{
                  background: tokens.color.warning.bg,
                  borderColor: tokens.color.warning.border,
                }}
              >
                <TriangleAlert
                  size={20}
                  strokeWidth={1.6}
                  style={{ color: tokens.color.warning.fg }}
                  aria-hidden
                />
                <span className="grow text-[14px] text-text-body">
                  <strong className="text-ink">
                    {pending} {pending! > 1 ? 'demandes d’inscription' : 'demande d’inscription'}
                  </strong>{' '}
                  {pending! > 1 ? 'attendent' : 'attend'} votre validation.
                </span>
                <Link
                  href="/clients"
                  className="inline-flex h-9 items-center rounded-control bg-ink px-4 text-[14px] font-semibold text-white"
                >
                  Examiner
                </Link>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              {kpis.map((k) => (
                <div
                  key={k.label}
                  className="flex flex-col gap-2.5 rounded-block border border-border bg-white p-5"
                >
                  <span className="text-[13px] text-text-secondary">{k.label}</span>
                  <span className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] tabular-nums">
                    {k.v}
                  </span>
                  <span className="flex items-center gap-2 text-[12px] text-text-secondary">
                    <Delta value={k.d} suffix={k.abs ? '' : ' %'} /> vs période précédente
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4">
              <section className={`${card} flex min-w-0 flex-col gap-5`}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[16px] leading-[22px] font-semibold">Commandes reçues</h2>
                  <span className="text-[13px] text-text-secondary">
                    {periodLabel(period, stats.period_start)}
                  </span>
                </div>
                <OrdersChart
                  data={stats.series.map((s) => ({
                    label: bucketLabel(period, s.bucket),
                    orders: s.orders,
                  }))}
                />
              </section>

              <section className={`${card} flex flex-col gap-2`}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[16px] leading-[22px] font-semibold">
                    Produits les plus commandés
                  </h2>
                  <Link href="/produits" className="text-[13px] font-medium">
                    Catalogue
                  </Link>
                </div>
                {stats.top_products.length === 0 && (
                  <p className="py-6 text-center text-[13px] text-text-secondary">
                    Aucune commande sur la période.
                  </p>
                )}
                {stats.top_products.map((p, i) => (
                  <div
                    key={p.product_id}
                    className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-divider' : ''}`}
                  >
                    <ProductImage
                      product={images?.find((x) => x.id === p.product_id) ?? {}}
                      title={p.title}
                      dimension={40}
                      className="shrink-0"
                    />
                    <div className="flex min-w-0 grow flex-col gap-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="truncate text-[14px] font-medium">{p.title}</span>
                        <span className="text-[13px] font-semibold tabular-nums">
                          {formatNumber(p.units)} u.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-[76px] font-mono text-[11px] text-text-secondary">
                          {p.reference}
                        </span>
                        <span className="h-1 grow overflow-hidden rounded-full bg-divider">
                          <span
                            className="block h-1 bg-ink"
                            style={{ width: `${Math.round((p.units / max) * 100)}%` }}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <section className={`${card} flex flex-col gap-3`}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[16px] leading-[22px] font-semibold">Activité par magasin</h2>
                  <span className="text-[13px] text-text-secondary">
                    {period === 'year'
                      ? stats.period_start.slice(0, 4)
                      : period === 'week'
                        ? 'Cette semaine'
                        : periodMonthLabel(stats.period_start)}
                  </span>
                </div>
                <div role="table" aria-label="Activité par magasin">
                  <div
                    role="row"
                    className="grid grid-cols-[minmax(0,1fr)_90px_120px] gap-4 border-b border-border pb-2.5 text-[12px] font-medium text-text-secondary"
                  >
                    <span role="columnheader">Magasin</span>
                    <span role="columnheader" className="text-right">
                      Commandes
                    </span>
                    <span role="columnheader" className="text-right">
                      Montant HT
                    </span>
                  </div>
                  {stats.top_stores.length === 0 && (
                    <p className="py-6 text-center text-[13px] text-text-secondary">
                      Aucune commande sur la période.
                    </p>
                  )}
                  {stats.top_stores.map((s) => (
                    <div
                      key={s.id}
                      role="row"
                      className="grid h-[52px] grid-cols-[minmax(0,1fr)_90px_120px] items-center gap-4 border-b border-divider"
                    >
                      <div role="cell" className="flex min-w-0 flex-col">
                        <span className="truncate text-[14px] font-medium">{s.name}</span>
                        <span className="truncate text-[12px] text-text-secondary">
                          {s.legal_name}
                        </span>
                      </div>
                      <span role="cell" className="text-right text-[14px] tabular-nums">
                        {s.orders}
                      </span>
                      <span
                        role="cell"
                        className="text-right text-[14px] font-semibold tabular-nums"
                      >
                        {formatEuro(s.total_ht)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`${card} flex flex-col gap-1`}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[16px] leading-[22px] font-semibold">Dernières commandes</h2>
                  <Link href="/commandes" className="text-[13px] font-medium">
                    Tout voir
                  </Link>
                </div>
                {(latest ?? []).length === 0 && (
                  <p className="py-6 text-center text-[13px] text-text-secondary">
                    Aucune commande pour le moment.
                  </p>
                )}
                {(latest ?? []).map((o) => (
                  <Link
                    key={o.id}
                    href={`/commandes/${o.id}`}
                    className="grid h-[52px] grid-cols-[minmax(0,1fr)_110px_130px] items-center gap-4 border-b border-divider"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-[13px]">{o.number}</span>
                      <span className="truncate text-[12px] text-text-secondary">
                        {o.stores?.name} · {formatRelative(o.created_at)}
                      </span>
                    </div>
                    <span className="text-right text-[14px] font-semibold tabular-nums">
                      {formatEuro(o.total_ht)}
                    </span>
                    <span className="flex justify-end">
                      <StatusBadge status={o.status as OrderStatus} />
                    </span>
                  </Link>
                ))}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
