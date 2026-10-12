'use client';

import Link from 'next/link';
import { useActionState, useState, useTransition } from 'react';
import { ChevronLeft, Info, Trash2 } from 'lucide-react';
import { formatEuro, stockLabel, type PlaceholderShape } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { ProductImage } from '@/components/ProductImage';
import { StockBadge } from '@/components/Badge';
import { PhotoManager, type Photo } from './PhotoManager';
import { Switch } from './VisibilitySwitch';
import {
  createBrand,
  createCategory,
  deleteProduct,
  saveProduct,
  type ProductFormState,
} from './actions';

export interface ProductValues {
  title: string;
  brand_id: string;
  category_id: string;
  reference: string;
  ean: string;
  description: string;
  body: string;
  price_ht: string;
  weight_kg: string;
  stock: string;
  is_visible: boolean;
  placeholder_shape: PlaceholderShape;
}
export const EMPTY: ProductValues = {
  title: '',
  brand_id: '',
  category_id: '',
  reference: '',
  ean: '',
  description: '',
  body: '',
  price_ht: '',
  weight_kg: '',
  stock: '0',
  is_visible: true,
  placeholder_shape: 'tall',
};

const area =
  'rounded-control border bg-white px-3 py-2.5 text-[14px] leading-[21px] outline-none focus:border-ink focus:shadow-[0_0_0_1px_#0a0a0a] resize-none';
const selectClass = 'h-10 w-full rounded-control border border-border bg-white px-3 text-[14px]';
const card = 'flex flex-col gap-4 rounded-block border border-border bg-white p-6';

export function ProductForm({
  id,
  initial,
  photos,
  brands: initialBrands,
  categories: initialCategories,
}: {
  id: string | null;
  initial: ProductValues;
  photos: Photo[];
  brands: { id: string; name: string }[];
  categories: { id: string; label: string }[];
}) {
  const [v, setV] = useState(initial);
  const [brands, setBrands] = useState(initialBrands);
  const [categories, setCategories] = useState(initialCategories);
  const [state, action, pending] = useActionState<ProductFormState, FormData>(
    saveProduct.bind(null, id),
    {},
  );
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();
  const e = state.errors ?? {};
  const set =
    <K extends keyof ProductValues>(k: K) =>
    (val: ProductValues[K]) =>
      setV((p) => ({ ...p, [k]: val }));
  const input = (k: keyof ProductValues) => ({
    name: k,
    value: String(v[k]),
    onChange: (ev: { target: { value: string } }) => set(k)(ev.target.value as never),
  });

  async function addBrand() {
    const name = window.prompt('Nom de la nouvelle marque');
    if (!name) return;
    const r = await createBrand(name);
    if (r.error) return window.alert(r.error);
    setBrands((b) =>
      [...b, { id: r.id!, name: r.name! }].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    );
    set('brand_id')(r.id!);
  }
  async function addCategory() {
    const name = window.prompt('Nom de la nouvelle catégorie');
    if (!name) return;
    const parent = categories.find((c) => c.id === v.category_id);
    const asChild =
      parent &&
      !parent.label.includes('›') &&
      window.confirm(
        `Créer « ${name} » dans « ${parent.label} » ?\n(Annuler : catégorie de premier niveau)`,
      );
    const r = await createCategory(name, asChild ? parent!.id : null);
    if (r.error) return window.alert(r.error);
    setCategories((c) => [
      ...c,
      { id: r.id!, label: asChild ? `${parent!.label} › ${r.label}` : r.label! },
    ]);
    set('category_id')(r.id!);
  }

  const price = Number(v.price_ht.replace(',', '.'));
  const stock = Number(v.stock);
  return (
    <form action={action}>
      <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-border px-8">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <Link
            href="/produits"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary"
          >
            <ChevronLeft size={14} strokeWidth={2} aria-hidden /> Produits &amp; stocks
          </Link>
          <h1 className="truncate text-[20px] leading-[26px] font-semibold tracking-[-0.01em]">
            {v.title || 'Nouveau produit'}
          </h1>
        </div>
        {state.saved && (
          <span role="status" className="text-[13px] font-medium text-success-fg">
            Enregistré
          </span>
        )}
        {id && (
          <Button
            variant="secondary"
            aria-label="Supprimer le produit"
            disabled={deleting}
            onClick={() => {
              if (!window.confirm('Supprimer définitivement ce produit ?')) return;
              startDelete(async () => setDeleteError((await deleteProduct(id))?.error));
            }}
          >
            <Trash2 size={20} strokeWidth={1.6} aria-hidden /> Supprimer
          </Button>
        )}
        <Link
          href="/produits"
          className="inline-flex h-10 items-center rounded-control border border-border-strong bg-white px-4 text-[14px] font-semibold"
        >
          Annuler
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </header>

      <div className="flex flex-col gap-4 px-8 pt-7 pb-8">
        {(state.formError || deleteError) && (
          <p role="alert" className="text-[13px] text-error">
            {state.formError ?? deleteError}
          </p>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-6">
          <div className="flex flex-col gap-6">
            <section className={card}>
              <h2 className="text-[16px] leading-[22px] font-semibold">Informations produit</h2>
              <Field label="Titre" {...input('title')} error={e.title} />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="brand_id" className="text-[13px] font-medium">
                    Marque
                  </label>
                  <select
                    id="brand_id"
                    className={selectClass}
                    value={v.brand_id}
                    name="brand_id"
                    onChange={(ev) =>
                      ev.target.value === '__new' ? addBrand() : set('brand_id')(ev.target.value)
                    }
                  >
                    <option value="">Aucune</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                    <option value="__new">+ Créer une marque…</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="category_id" className="text-[13px] font-medium">
                    Catégorie
                  </label>
                  <select
                    id="category_id"
                    className={selectClass}
                    value={v.category_id}
                    name="category_id"
                    onChange={(ev) =>
                      ev.target.value === '__new'
                        ? addCategory()
                        : set('category_id')(ev.target.value)
                    }
                  >
                    <option value="">Aucune</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                    <option value="__new">+ Créer une catégorie…</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Référence" mono {...input('reference')} error={e.reference} />
                <Field
                  label="Code EAN"
                  mono
                  inputMode="numeric"
                  maxLength={13}
                  {...input('ean')}
                  error={e.ean}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-[13px] font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  className={`${area} h-16 border-border`}
                  {...input('description')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="body" className="text-[13px] font-medium">
                  Texte produit
                </label>
                <textarea
                  id="body"
                  className={`${area} h-32 ${e.body ? 'border-error' : 'border-border'}`}
                  {...input('body')}
                />
                <span
                  className={`self-end text-[12px] tabular-nums ${v.body.length > 1000 ? 'text-error' : 'text-text-secondary'}`}
                >
                  {v.body.length} / 1 000
                </span>
                {e.body && <span className="text-[13px] text-error">{e.body}</span>}
              </div>
            </section>

            <section className={card}>
              <h2 className="text-[16px] leading-[22px] font-semibold">Prix et stock</h2>
              <div className="grid grid-cols-3 gap-4">
                <Field
                  label="Prix HT (€)"
                  inputMode="decimal"
                  {...input('price_ht')}
                  error={e.price_ht}
                />
                <Field
                  label="Poids (kg)"
                  inputMode="decimal"
                  {...input('weight_kg')}
                  error={e.weight_kg}
                />
                <Field
                  label="Stock disponible (u.)"
                  inputMode="numeric"
                  {...input('stock')}
                  error={e.stock}
                />
              </div>
              <p className="flex gap-2 text-[13px] leading-[18px] text-text-secondary">
                <Info size={16} strokeWidth={1.6} className="mt-px shrink-0" aria-hidden />
                Le stock est décrémenté automatiquement à chaque commande et restitué si une
                commande est annulée. À zéro, le produit s’affiche « Rupture » côté client.
              </p>
            </section>
          </div>

          <div className="flex flex-col gap-4">
            <section className="flex items-center justify-between gap-3 rounded-block border border-border bg-white p-5">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[16px] leading-[22px] font-semibold">
                  Visible dans le catalogue
                </h2>
                <span className="text-[13px] text-text-secondary">
                  {v.is_visible
                    ? 'Visible par tous les clients actifs'
                    : 'Masqué : les clients ne le voient pas'}
                </span>
              </div>
              <Switch
                checked={v.is_visible}
                label="Visible dans le catalogue"
                onChange={set('is_visible')}
              />
              {v.is_visible && <input type="hidden" name="is_visible" value="on" />}
            </section>

            <section className="flex flex-col gap-3 rounded-block border border-border bg-white p-5">
              <h2 className="text-[16px] leading-[22px] font-semibold">Photos</h2>
              {id ? (
                <PhotoManager
                  productId={id}
                  photos={photos}
                  shape={v.placeholder_shape}
                  title={v.title}
                />
              ) : (
                <p className="text-[13px] text-text-secondary">
                  Enregistrez le produit pour ajouter des photos.
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="placeholder_shape" className="text-[13px] font-medium">
                  Visuel de remplacement (sans photo)
                </label>
                <select
                  id="placeholder_shape"
                  name="placeholder_shape"
                  className={selectClass}
                  value={v.placeholder_shape}
                  onChange={(ev) => set('placeholder_shape')(ev.target.value as PlaceholderShape)}
                >
                  <option value="tall">Flacon haut</option>
                  <option value="round">Flacon rond</option>
                  <option value="tube">Tube</option>
                </select>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-block border border-border bg-white p-5">
              <h2 className="text-[16px] leading-[22px] font-semibold">Aperçu dans l’app</h2>
              <div className="flex items-center gap-3">
                <ProductImage
                  product={{
                    placeholder_shape: v.placeholder_shape,
                    product_images: photos.map((p, i) => ({
                      path: p.path,
                      thumb_path: p.thumb_path,
                      position: i,
                    })),
                  }}
                  title={v.title || 'Aperçu'}
                  size="thumb"
                  dimension={120}
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[11px] font-medium tracking-[0.06em] text-text-secondary uppercase">
                    {brands.find((b) => b.id === v.brand_id)?.name ?? ''}
                  </span>
                  <span className="text-[14px] leading-[19px] font-medium">
                    {v.title || 'Titre du produit'}
                  </span>
                  <span className="font-mono text-[11px] text-text-secondary">{v.reference}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold tabular-nums">
                      {Number.isFinite(price) ? formatEuro(price) : ''}
                    </span>
                    {Number.isInteger(stock) && stock >= 0 && <StockBadge stock={stock} />}
                  </span>
                  {Number.isInteger(stock) && stock >= 0 && (
                    <span className="sr-only">{stockLabel(stock)}</span>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </form>
  );
}
