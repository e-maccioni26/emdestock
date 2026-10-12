import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LOW_STOCK_THRESHOLD, formatEuro, formatNumber } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';
import { StockBadge } from '@/components/Badge';
import { ProductImage } from '@/components/ProductImage';
import { ProductFilters } from './ProductFilters';
import { VisibilitySwitch } from './VisibilitySwitch';
import { loadOptions } from './options';

const PAGE_SIZE = 20;
const TABS = [
  ['all', 'Tous'],
  ['visible', 'Visibles'],
  ['hidden', 'Masqués'],
  ['low', 'Stock faible'],
  ['out', 'Rupture'],
] as const;
type Tab = (typeof TABS)[number][0];

type Params = { tab?: string; q?: string; brand?: string; category?: string; page?: string };

export default async function Produits({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const tab = (TABS.some(([k]) => k === sp.tab) ? sp.tab : 'all') as Tab;
  const page = Math.max(1, Number(sp.page) || 1);

  // Recherche titre / référence / EAN : la colonne "search" est déjà sans accents ni majuscules.
  const needle = (sp.q ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  type Filterable<T> = {
    ilike(column: string, pattern: string): T;
    eq(column: string, value: string | boolean | number): T;
    gt(column: string, value: number): T;
    lt(column: string, value: number): T;
  };
  const apply = <T extends Filterable<T>>(q: T, t: Tab): T => {
    let r = q;
    if (needle) r = r.ilike('search', `%${needle.replace(/[%_\\]/g, '\\$&')}%`);
    if (sp.brand) r = r.eq('brand_id', sp.brand);
    if (sp.category) r = r.eq('category_id', sp.category);
    if (t === 'visible') r = r.eq('is_visible', true);
    if (t === 'hidden') r = r.eq('is_visible', false);
    if (t === 'low') r = r.gt('stock', 0).lt('stock', LOW_STOCK_THRESHOLD);
    if (t === 'out') r = r.eq('stock', 0);
    return r;
  };

  const counts = await Promise.all(
    TABS.map(([k]) =>
      apply(supabase.from('products').select('id', { count: 'exact', head: true }), k).then(
        (r: { count: number | null }) => r.count ?? 0,
      ),
    ),
  );
  const total = counts[TABS.findIndex(([k]) => k === tab)] ?? 0;
  const [{ data: rows }, { brands, categories }] = await Promise.all([
    apply(
      supabase
        .from('products')
        .select(
          'id, title, reference, ean, price_ht, stock, is_visible, placeholder_shape, brands(name), product_images(path, thumb_path, position)',
        ),
      tab,
    )
      .order('created_at', { ascending: false })
      .order('id')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    loadOptions(supabase),
  ]);

  const href = (over: Partial<Params>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...over };
    for (const [k, v] of Object.entries(merged))
      if (v && !(k === 'page' && v === '1') && !(k === 'tab' && v === 'all')) p.set(k, v);
    const s = p.toString();
    return `/produits${s ? `?${s}` : ''}`;
  };
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-border px-8">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h1 className="text-[20px] leading-[26px] font-semibold tracking-[-0.01em]">
            Produits &amp; stocks
          </h1>
          <p className="text-[13px] leading-[18px] text-text-secondary">
            {formatNumber(counts[0] ?? 0)} références · {formatNumber(counts[4] ?? 0)} en rupture
          </p>
        </div>
        <Link
          href="/produits/nouveau"
          className="inline-flex h-10 items-center gap-2 rounded-control bg-ink px-4 text-[14px] font-semibold text-white"
        >
          <Plus size={20} strokeWidth={1.6} aria-hidden />
          Ajouter un produit
        </Link>
      </header>
      <div className="flex grow flex-col gap-6 px-8 pt-7 pb-8">
        <div role="tablist" className="flex gap-1 border-b border-border">
          {TABS.map(([k, label], i) => (
            <Link
              key={k}
              role="tab"
              aria-selected={tab === k}
              href={href({ tab: k, page: '1' })}
              className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-[14px] ${tab === k ? 'border-ink font-semibold text-ink' : 'border-transparent font-medium text-text-body'}`}
            >
              {label}
              <span className="text-[12px] font-medium text-text-secondary tabular-nums">
                {formatNumber(counts[i] ?? 0)}
              </span>
            </Link>
          ))}
        </div>
        <ProductFilters
          q={sp.q ?? ''}
          brand={sp.brand ?? ''}
          category={sp.category ?? ''}
          brands={brands}
          categories={categories}
        />
        <div
          role="table"
          aria-label="Produits"
          className="overflow-hidden rounded-block border border-border bg-white"
        >
          <div
            role="row"
            className="grid h-11 grid-cols-[minmax(0,1fr)_104px_128px_84px_150px_64px] items-center gap-4 border-b border-border bg-surface-alt px-5 text-[12px] font-medium text-text-secondary"
          >
            <span role="columnheader">Produit</span>
            <span role="columnheader">Réf.</span>
            <span role="columnheader">EAN</span>
            <span role="columnheader" className="text-right">
              Prix HT
            </span>
            <span role="columnheader">Stock</span>
            <span role="columnheader">Visible</span>
          </div>
          {(rows ?? []).length === 0 && (
            <p className="px-5 py-10 text-center text-[14px] text-text-secondary">
              Aucun produit ne correspond à cette recherche.
            </p>
          )}
          {(rows ?? []).map((r) => (
            <div
              key={r.id}
              role="row"
              className={`grid h-[60px] grid-cols-[minmax(0,1fr)_104px_128px_84px_150px_64px] items-center gap-4 border-b border-divider px-5 ${r.is_visible ? '' : 'opacity-60'}`}
            >
              <Link
                role="cell"
                href={`/produits/${r.id}`}
                className="flex min-w-0 items-center gap-3"
              >
                <ProductImage
                  product={r}
                  title={r.title}
                  size="thumb"
                  dimension={40}
                  className="shrink-0"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[14px] font-medium">{r.title}</span>
                  <span className="text-[12px] text-text-secondary">{r.brands?.name}</span>
                </span>
              </Link>
              <span role="cell" className="font-mono text-[12px]">
                {r.reference}
              </span>
              <span role="cell" className="font-mono text-[12px]">
                {r.ean}
              </span>
              <span role="cell" className="text-right text-[14px] tabular-nums">
                {formatEuro(r.price_ht)}
              </span>
              <span role="cell" className="flex items-center gap-2">
                <span className="w-8 text-right text-[14px] tabular-nums">{r.stock}</span>
                <StockBadge stock={r.stock} />
              </span>
              <span role="cell">
                <VisibilitySwitch id={r.id} visible={r.is_visible} title={r.title} />
              </span>
            </div>
          ))}
        </div>
        {pages > 1 && (
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between text-[13px] text-text-secondary"
          >
            <span className="tabular-nums">
              Page {page} sur {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 && (
                <Link
                  href={href({ page: String(page - 1) })}
                  className="inline-flex h-9 items-center rounded-control border border-border-strong px-3 font-semibold text-ink"
                >
                  Précédent
                </Link>
              )}
              {page < pages && (
                <Link
                  href={href({ page: String(page + 1) })}
                  className="inline-flex h-9 items-center rounded-control border border-border-strong px-3 font-semibold text-ink"
                >
                  Suivant
                </Link>
              )}
            </span>
          </nav>
        )}
      </div>
    </>
  );
}
