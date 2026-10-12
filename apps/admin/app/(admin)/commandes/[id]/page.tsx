import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Store as StoreIcon } from 'lucide-react';
import {
  LOW_STOCK_THRESHOLD,
  formatDateTimeLong,
  formatEuro,
  formatNumber,
  formatSiret,
  orderStatusLabel,
  tokens,
  type OrderStatus,
} from '@emd/shared';
import { requireAdmin } from '@/lib/auth';
import { ProductImage } from '@/components/ProductImage';
import { CancelButton } from './CancelButton';
import { PrintButton } from './PrintButton';
import { StatusPanel } from './StatusPanel';

const card = 'rounded-block border border-border bg-white';
const cols = 'tbl:grid-cols-[minmax(0,1fr)_52px_84px_96px_104px]';
const label = 'block text-[11px] font-normal text-text-secondary tbl:hidden';

type Event = {
  id: string;
  type: string;
  payload: { units?: number; from?: OrderStatus; to?: OrderStatus };
  created_at: string;
};

function timeline(events: Event[]): { label: string; detail: string }[] {
  return events.flatMap((e): { label: string; detail: string }[] => {
    const at = formatDateTimeLong(e.created_at);
    switch (e.type) {
      case 'created':
        return [
          { label: 'Commande reçue', detail: at },
          {
            label: 'Stock décrémenté automatiquement',
            detail: `${at}${e.payload.units ? ` · ${e.payload.units} unités` : ''}`,
          },
        ];
      case 'admin_email_sent':
        return [{ label: 'Notification e-mail envoyée', detail: 'À l’administrateur' }];
      case 'status_changed':
        return [
          {
            label: `Statut : ${e.payload.from ? orderStatusLabel(e.payload.from) : ''} → ${e.payload.to ? orderStatusLabel(e.payload.to) : ''}`,
            detail: at,
          },
        ];
      case 'stock_restored':
        return [{ label: 'Stock remis en stock', detail: at }];
      default:
        return [];
    }
  });
}

export default async function CommandeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: o } = await supabase
    .from('orders')
    .select(
      `id, number, status, message, total_ht, units, created_at, viewed_at,
       companies(legal_name, siret, phone),
       stores(name, address, postal_code, city),
       profiles:created_by(first_name, last_name, email, phone),
       order_items(id, reference, title, ean, unit_price_ht, quantity, line_total_ht,
         products(stock, placeholder_shape, brands(name), product_images(path, thumb_path, position))),
       order_events(id, type, payload, created_at)`,
    )
    .eq('id', id)
    .maybeSingle();
  if (!o) notFound();

  // Ouvrir le détail marque la commande comme consultée (point rouge de la liste).
  if (o.viewed_at === null)
    await supabase
      .from('orders')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', id)
      .is('viewed_at', null);

  const status = o.status as OrderStatus;
  const contact = o.profiles;
  const events = [...o.order_events].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  ) as Event[];
  const info = (label: string, value: string | null | undefined, mono = false) => (
    <div className="flex justify-between gap-3 py-2 text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={`text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );

  return (
    <>
      <header className="flex shrink-0 flex-col gap-2 px-5 pt-1 pb-3 md:h-[76px] md:flex-row md:items-center md:gap-3 md:border-b md:border-border md:py-0 md:pr-[88px] md:pl-8">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <Link
            href="/commandes"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary print:hidden"
          >
            <ChevronLeft size={14} strokeWidth={2} aria-hidden /> Commandes
          </Link>
          <h1 className="font-mono text-[22px] leading-[28px] font-semibold tracking-[-0.01em] md:text-[20px] md:leading-[26px]">
            {o.number}
          </h1>
        </div>
        <span className="text-[13px] text-text-secondary md:mr-2">
          Reçue le {formatDateTimeLong(o.created_at)}
        </span>
        <PrintButton />
      </header>

      <div className="flex grow flex-col gap-4 px-5 pt-2 pb-6 md:gap-6 md:px-8 md:pt-7 md:pb-8">
        <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] print:grid-cols-1">
          <div className="flex flex-col gap-6">
            <div role="table" aria-label="Produits commandés" className={`${card} overflow-hidden`}>
              <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 md:px-5 md:pt-5 md:pb-4">
                <h2 className="text-[16px] leading-[22px] font-semibold">Produits commandés</h2>
                <span className="text-[13px] text-text-secondary">
                  {o.order_items.length} références · {formatNumber(o.units)} unités
                </span>
              </div>
              <div
                role="row"
                className={`hidden h-10 tbl:grid ${cols} items-center gap-4 border-y border-border bg-surface-alt px-5 text-[12px] font-medium text-text-secondary`}
              >
                <span role="columnheader">Produit</span>
                <span role="columnheader" className="text-right">
                  Qté
                </span>
                <span role="columnheader" className="text-right">
                  Prix HT
                </span>
                <span role="columnheader" className="text-right">
                  Total HT
                </span>
                <span role="columnheader" className="text-right">
                  Stock restant
                </span>
              </div>
              {o.order_items.map((i) => {
                const stock = i.products?.stock;
                return (
                  <div
                    key={i.id}
                    role="row"
                    className={`grid grid-cols-4 items-center gap-x-2 gap-y-2.5 border-t border-divider px-4 py-3 md:px-5 tbl:h-[68px] tbl:gap-4 tbl:border-t-0 tbl:border-b tbl:py-0 ${cols}`}
                  >
                    <div
                      role="cell"
                      className="col-span-4 flex min-w-0 items-center gap-3 tbl:col-auto"
                    >
                      <ProductImage
                        product={i.products ?? {}}
                        title={i.title}
                        dimension={40}
                        className="shrink-0"
                      />
                      <div className="flex min-w-0 flex-col gap-[3px]">
                        <span className="truncate text-[14px] font-medium">{i.title}</span>
                        <span className="truncate text-[12px] text-text-secondary">
                          {i.products?.brands?.name ? `${i.products.brands.name} · ` : ''}
                          <span className="font-mono text-text-body">{i.reference}</span> · EAN{' '}
                          <span className="font-mono">{i.ean}</span>
                        </span>
                      </div>
                    </div>
                    <span role="cell" className="text-right text-[14px] font-semibold tabular-nums">
                      <span className={label}>Qté</span>
                      {i.quantity}
                    </span>
                    <span role="cell" className="text-right text-[14px] tabular-nums">
                      <span className={label}>Prix HT</span>
                      {formatEuro(i.unit_price_ht)}
                    </span>
                    <span role="cell" className="text-right text-[14px] font-semibold tabular-nums">
                      <span className={label}>Total HT</span>
                      {formatEuro(i.line_total_ht)}
                    </span>
                    <span
                      role="cell"
                      className="text-right text-[14px] tabular-nums"
                      style={
                        stock !== undefined && stock < LOW_STOCK_THRESHOLD
                          ? { color: tokens.color.warning.fg, fontWeight: 600 }
                          : undefined
                      }
                    >
                      <span className={label}>Stock</span>
                      {stock ?? '—'}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-baseline justify-between gap-6 border-t border-divider px-4 py-4 md:px-5 tbl:justify-end tbl:border-t-0">
                <span className="text-[14px] text-text-secondary">Total estimé</span>
                <span className="text-[20px] font-semibold tabular-nums">
                  {formatEuro(o.total_ht)}{' '}
                  <span className="text-[13px] font-medium text-text-secondary">HT</span>
                </span>
              </div>
            </div>
            {o.message && (
              <section className={`${card} flex flex-col gap-2.5 p-5`}>
                <h2 className="text-[16px] leading-[22px] font-semibold">Message du client</h2>
                <p className="rounded-card bg-stone px-4 py-3.5 text-[14px] leading-[21px] whitespace-pre-wrap">
                  {o.message}
                </p>
              </section>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <StatusPanel orderId={o.id} status={status} />
            <section className={`${card} flex flex-col gap-1.5 p-5`}>
              <h2 className="text-[16px] leading-[22px] font-semibold">Client</h2>
              {info('Raison sociale', o.companies?.legal_name)}
              {info('Contact', contact ? `${contact.first_name} ${contact.last_name}` : null)}
              {info('E-mail', contact?.email)}
              {info('Téléphone', contact?.phone ?? o.companies?.phone)}
              {info('SIRET', o.companies ? formatSiret(o.companies.siret) : null, true)}
            </section>
            <section className={`${card} flex items-start gap-3 p-5`}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-stone">
                <StoreIcon size={20} strokeWidth={1.6} aria-hidden />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-medium text-text-secondary">
                  Magasin de livraison
                </span>
                <span className="text-[15px] font-semibold">{o.stores?.name}</span>
                <span className="text-[13px] text-text-secondary">
                  {o.stores && `${o.stores.address}, ${o.stores.postal_code} ${o.stores.city}`}
                </span>
              </div>
            </section>
            <section className={`${card} flex flex-col gap-3 p-5 print:hidden`}>
              <h2 className="text-[16px] leading-[22px] font-semibold">Historique</h2>
              {timeline(events).map((e, idx) => (
                <div key={idx} className="flex gap-2.5">
                  <span
                    className={`mt-[5px] size-2 shrink-0 rounded-full ${idx === 0 ? 'bg-ink' : 'bg-border-strong'}`}
                    aria-hidden
                  />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium">{e.label}</span>
                    <span className="text-[12px] text-text-secondary">{e.detail}</span>
                  </div>
                </div>
              ))}
              {status !== 'cancelled' && <CancelButton orderId={o.id} />}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
