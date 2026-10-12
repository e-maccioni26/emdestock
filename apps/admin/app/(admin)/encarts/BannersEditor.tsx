'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Plus } from 'lucide-react';
import {
  BANNER_LIMITS,
  MAX_ACTIVE_BANNERS,
  bannerStatus,
  bannerStatusLabel,
  bannerStatusTone,
  tokens,
  toneColors,
  toParisDate,
  type BannerAudience,
  type BannerTarget,
  type BannerTheme,
  type PlaceholderShape,
} from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { BannerPreview } from './BannerPreview';
import { ProductPicker, type PickedProduct } from './ProductPicker';
import { deleteBanner, reorderBanners, saveBanner, type BannerDraft } from './actions';

export interface BannerRow {
  id: string;
  theme: BannerTheme;
  eyebrow: string;
  title: string;
  cta_label: string;
  image_path: string | null;
  target_type: BannerTarget;
  target_id: string | null;
  audience: BannerAudience;
  starts_at: string;
  ends_at: string;
  shape: PlaceholderShape;
  products: PickedProduct[];
}

const DAY = 86400_000;
const today = () => toParisDate(new Date());
const EMPTY: BannerDraft = {
  id: null,
  theme: 'encre',
  eyebrow: '',
  title: '',
  cta_label: 'Découvrir',
  image_path: null,
  target_type: 'brand',
  target_id: null,
  productIds: [],
  audience: 'all',
  start: today(),
  end: toParisDate(new Date(Date.now() + 14 * DAY)),
};
const DESTS: [BannerTarget, string][] = [
  ['product', 'Produit'],
  ['category', 'Catégorie'],
  ['brand', 'Marque'],
  ['selection', 'Sélection de produits'],
];
const AUDIENCES: [BannerAudience, string][] = [
  ['new', 'Clients sans commande'],
  ['all', 'Tous les clients'],
];

const toDraft = (b: BannerRow): BannerDraft => ({
  id: b.id,
  theme: b.theme,
  eyebrow: b.eyebrow,
  title: b.title,
  cta_label: b.cta_label,
  image_path: b.image_path,
  target_type: b.target_type,
  target_id: b.target_id,
  productIds: b.products.map((p) => p.id),
  audience: b.audience,
  start: toParisDate(b.starts_at),
  end: toParisDate(new Date(new Date(b.ends_at).getTime() - 1000)), // fin incluse
});

function StatusPill({ status }: { status: ReturnType<typeof bannerStatus> }) {
  const c = toneColors(bannerStatusTone(status));
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.dot }} aria-hidden />
      {bannerStatusLabel(status)}
    </span>
  );
}

const chip = (on: boolean) =>
  `h-9 rounded-full border px-3 text-[13px] font-medium ${on ? 'border-ink bg-ink text-white' : 'border-border bg-white text-ink'}`;
const select = 'h-10 w-full rounded-control border border-border bg-white px-3 text-[14px]';

export function BannersEditor({
  banners,
  brands,
  categories,
  productTargets,
}: {
  banners: BannerRow[];
  brands: { id: string; name: string }[];
  categories: { id: string; label: string }[];
  productTargets: PickedProduct[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | 'new'>(banners[0]?.id ?? 'new');
  const [draft, setDraft] = useState<BannerDraft>(banners[0] ? toDraft(banners[0]) : EMPTY);
  const [picked, setPicked] = useState<PickedProduct[]>(banners[0]?.products ?? []);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const productLabel = useMemo(
    () => new Map(productTargets.map((p) => [p.id, p])),
    [productTargets],
  );
  const current = banners.find((b) => b.id === selected);
  // Un encart supprimé ailleurs ou après suppression : on retombe sur le premier.
  useEffect(() => {
    if (selected !== 'new' && !current) open(banners[0]?.id ?? 'new');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners]);

  function open(id: string | 'new') {
    const b = banners.find((x) => x.id === id);
    setSelected(id);
    setDraft(
      b
        ? toDraft(b)
        : { ...EMPTY, start: today(), end: toParisDate(new Date(Date.now() + 14 * DAY)) },
    );
    setPicked(
      b
        ? b.target_type === 'product' && b.target_id && productLabel.get(b.target_id)
          ? [productLabel.get(b.target_id)!]
          : b.products
        : [],
    );
    setError(undefined);
    setSaved(false);
  }
  const set = <K extends keyof BannerDraft>(k: K, v: BannerDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  const startsIso = `${draft.start}T00:00:00`;
  const draftStatus = bannerStatus({
    starts_at: new Date(startsIso).toISOString(),
    ends_at: new Date(new Date(`${draft.end}T00:00:00`).getTime() + DAY).toISOString(),
  });
  const previewShape: PlaceholderShape = current?.shape ?? 'tall';

  function save() {
    setError(undefined);
    start(async () => {
      const productIds = draft.target_type === 'selection' ? picked.map((p) => p.id) : [];
      const target_id = draft.target_type === 'product' ? (picked[0]?.id ?? null) : draft.target_id;
      const r = await saveBanner({ ...draft, productIds, target_id });
      if (r.error) return setError(r.error);
      setSaved(true);
      if (r.id && r.id !== selected) setSelected(r.id);
      router.refresh();
    });
  }
  function remove() {
    if (!draft.id || !window.confirm('Supprimer cet encart ?')) return;
    start(async () => {
      const r = await deleteBanner(draft.id!);
      if (r.error) return setError(r.error);
      router.refresh();
    });
  }
  function reorder(ids: string[]) {
    start(async () => {
      const r = await reorderBanners(ids);
      if (r.error) setError(r.error);
      router.refresh();
    });
  }
  const move = (i: number, d: -1 | 1) => {
    const ids = banners.map((b) => b.id);
    [ids[i], ids[i + d]] = [ids[i + d]!, ids[i]!];
    reorder(ids);
  };
  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = banners.map((b) => b.id).filter((id) => id !== dragId);
    ids.splice(ids.indexOf(targetId), 0, dragId);
    setDragId(null);
    reorder(ids);
  };
  async function upload(f: File | undefined) {
    if (!f) return;
    setError(undefined);
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch('/api/encarts/image', { method: 'POST', body: fd });
    const body = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
    if (!res.ok || !body.path) return setError(body.error ?? 'Envoi impossible.');
    set('image_path', body.path);
  }

  const activeCount = banners.filter((b) => bannerStatus(b) === 'active').length;
  return (
    <>
      <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-border pr-[88px] pl-8">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h1 className="text-[20px] leading-[26px] font-semibold tracking-[-0.01em]">
            Encarts d’accueil
          </h1>
          <p className="text-[13px] leading-[18px] text-text-secondary">
            Carrousel de l’écran d’accueil de l’app client · {activeCount} actif
            {activeCount > 1 ? 's' : ''} sur {MAX_ACTIVE_BANNERS} maximum
          </p>
        </div>
        <Button onClick={() => open('new')}>
          <Plus size={20} strokeWidth={1.6} aria-hidden /> Nouvel encart
        </Button>
      </header>

      <div className="grid grid-cols-[330px_minmax(0,1fr)_320px] items-start gap-6 px-8 pt-7 pb-8">
        <section className="flex flex-col gap-1 rounded-block border border-border bg-white p-2">
          <div className="flex items-baseline justify-between px-3 pt-3 pb-2">
            <h2 className="text-[16px] leading-[22px] font-semibold">Ordre d’affichage</h2>
            <span className="text-[12px] text-text-secondary">Glisser pour réordonner</span>
          </div>
          {banners.map((b, i) => {
            const t = tokens.bannerTheme[b.theme];
            const on = selected === b.id;
            return (
              <div
                key={b.id}
                draggable
                onDragStart={() => setDragId(b.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(b.id)}
                className={`flex items-center gap-2.5 rounded-card border p-2.5 ${on ? 'border-ink bg-surface-alt' : 'border-transparent bg-white'}`}
              >
                <GripVertical
                  size={16}
                  className="shrink-0 cursor-grab text-disabled-text"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => open(b.id)}
                  className="flex min-w-0 grow items-center gap-2.5 text-left"
                  aria-label={`Modifier l’encart ${b.title}`}
                  aria-current={on}
                >
                  <span
                    className="h-10 w-14 shrink-0 rounded-[8px] border"
                    style={{ background: t.bg, borderColor: t.border }}
                  />
                  <span className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="truncate text-[13px] font-semibold">{b.title}</span>
                    <span className="text-[12px] text-text-secondary">
                      {toParisDate(b.starts_at).slice(8)}/{toParisDate(b.starts_at).slice(5, 7)} →{' '}
                      {toParisDate(new Date(new Date(b.ends_at).getTime() - 1000)).slice(8)}/
                      {toParisDate(new Date(new Date(b.ends_at).getTime() - 1000)).slice(5, 7)}
                      {b.audience === 'new' ? ' · nouveaux clients' : ' · tous'}
                    </span>
                  </span>
                </button>
                <StatusPill status={bannerStatus(b)} />
                <span className="flex flex-col">
                  <button
                    type="button"
                    aria-label="Monter"
                    disabled={pending || i === 0}
                    onClick={() => move(i, -1)}
                    className="flex size-5 items-center justify-center disabled:opacity-30"
                  >
                    <ArrowUp size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Descendre"
                    disabled={pending || i === banners.length - 1}
                    onClick={() => move(i, 1)}
                    className="flex size-5 items-center justify-center disabled:opacity-30"
                  >
                    <ArrowDown size={14} aria-hidden />
                  </button>
                </span>
              </div>
            );
          })}
          {banners.length === 0 && (
            <p className="px-3 py-4 text-[13px] text-text-secondary">
              Aucun encart. Créez le premier avec « Nouvel encart ».
            </p>
          )}
          <p className="px-3 pt-2 pb-3 text-[12px] leading-[17px] text-text-secondary">
            Seuls les encarts actifs à la date du jour s’affichent, dans cet ordre.{' '}
            {MAX_ACTIVE_BANNERS} encarts actifs maximum en même temps.
          </p>
        </section>

        <section className="flex min-w-0 flex-col gap-[18px] rounded-block border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] leading-[22px] font-semibold">
              {draft.id ? 'Modifier l’encart' : 'Nouvel encart'}
            </h2>
            <StatusPill status={draftStatus} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Fond</span>
            <div className="flex items-center gap-2.5">
              {(Object.keys(tokens.bannerTheme) as BannerTheme[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Fond ${tokens.bannerTheme[k].label}`}
                  aria-pressed={draft.theme === k}
                  onClick={() => set('theme', k)}
                  className="size-9 rounded-full border border-border-strong"
                  style={{
                    background: tokens.bannerTheme[k].bg,
                    boxShadow: draft.theme === k ? '0 0 0 2px #FFFFFF, 0 0 0 4px #0A0A0A' : 'none',
                  }}
                />
              ))}
              <span className="mx-1 h-6 w-px bg-border" aria-hidden />
              <button
                type="button"
                onClick={() => file.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-dashed border-border-strong bg-white px-3 text-[13px] font-medium"
              >
                <ImagePlus size={16} strokeWidth={1.6} aria-hidden />{' '}
                {draft.image_path ? 'Changer l’image' : 'Image'}
              </button>
              {draft.image_path && (
                <button
                  type="button"
                  onClick={() => set('image_path', null)}
                  className="min-h-9 text-[13px] font-medium text-error"
                >
                  Retirer l’image
                </button>
              )}
              <input
                ref={file}
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={(e) => {
                  upload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
            {draft.image_path && (
              <span className="text-[12px] text-text-secondary">
                L’image remplace le fond uni ; un voile sombre garantit la lisibilité du texte.
              </span>
            )}
          </div>

          <Field
            label="Surtitre"
            value={draft.eyebrow}
            maxLength={BANNER_LIMITS.eyebrow}
            onChange={(e) => set('eyebrow', e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <Field
              label="Titre"
              value={draft.title}
              maxLength={BANNER_LIMITS.title}
              onChange={(e) => set('title', e.target.value)}
            />
            <span className="self-end text-[12px] text-text-secondary tabular-nums">
              {draft.title.length} / {BANNER_LIMITS.title}
            </span>
          </div>
          <Field
            label="Texte du bouton"
            value={draft.cta_label}
            maxLength={BANNER_LIMITS.cta}
            onChange={(e) => set('cta_label', e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Destination au clic</span>
            <div className="flex flex-wrap gap-1.5">
              {DESTS.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={draft.target_type === k}
                  className={chip(draft.target_type === k)}
                  onClick={() => {
                    set('target_type', k);
                    set('target_id', null);
                    setPicked([]);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {draft.target_type === 'category' && (
              <select
                aria-label="Catégorie visée"
                className={select}
                value={draft.target_id ?? ''}
                onChange={(e) => set('target_id', e.target.value || null)}
              >
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
            {draft.target_type === 'brand' && (
              <select
                aria-label="Marque visée"
                className={select}
                value={draft.target_id ?? ''}
                onChange={(e) => set('target_id', e.target.value || null)}
              >
                <option value="">Choisir une marque</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            {(draft.target_type === 'product' || draft.target_type === 'selection') && (
              <ProductPicker
                selected={picked}
                multiple={draft.target_type === 'selection'}
                onChange={(p) => {
                  setPicked(p);
                  setSaved(false);
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Affiché pour</span>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={draft.audience === k}
                  className={chip(draft.audience === k)}
                  onClick={() => set('audience', k)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Début"
              type="date"
              value={draft.start}
              onChange={(e) => set('start', e.target.value)}
            />
            <Field
              label="Fin (incluse)"
              type="date"
              value={draft.end}
              min={draft.start}
              onChange={(e) => set('end', e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-error">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            {draft.id ? (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="min-h-11 text-[13px] font-medium text-error"
              >
                Supprimer l’encart
              </button>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-3">
              {saved && (
                <span role="status" className="text-[13px] font-medium text-success-fg">
                  Enregistré
                </span>
              )}
              <Button onClick={save} disabled={pending}>
                {pending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </span>
          </div>
        </section>

        <div className="flex flex-col items-center gap-3">
          <span className="self-start text-[13px] font-medium text-text-secondary">
            Aperçu dans l’app
          </span>
          <BannerPreview
            banner={{
              theme: draft.theme,
              eyebrow: draft.eyebrow,
              title: draft.title,
              cta_label: draft.cta_label,
              image_path: draft.image_path,
              shape: previewShape,
            }}
            count={banners.length || 1}
          />
        </div>
      </div>
    </>
  );
}
