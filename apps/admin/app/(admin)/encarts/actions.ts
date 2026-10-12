'use server';

import { revalidatePath } from 'next/cache';
import {
  BANNER_IMAGES_BUCKET,
  BANNER_LIMITS,
  MAX_ACTIVE_BANNERS,
  exceedsActiveLimit,
  parisMidnight,
  type BannerAudience,
  type BannerTarget,
  type BannerTheme,
  type PlaceholderShape,
} from '@emd/shared';
import { requireAdmin } from '@/lib/auth';

export interface BannerDraft {
  id: string | null;
  theme: BannerTheme;
  eyebrow: string;
  title: string;
  cta_label: string;
  image_path: string | null;
  target_type: BannerTarget;
  target_id: string | null;
  productIds: string[];
  audience: BannerAudience;
  /** Dates à Paris (AAAA-MM-JJ) ; la fin est incluse. */
  start: string;
  end: string;
}

const DAY = 86400_000;

export async function saveBanner(d: BannerDraft): Promise<{ id?: string; error?: string }> {
  const { supabase } = await requireAdmin();
  const eyebrow = d.eyebrow.trim();
  const title = d.title.trim();
  const cta = d.cta_label.trim();
  if (!eyebrow || !title || !cta)
    return { error: 'Surtitre, titre et texte du bouton sont requis.' };
  if (
    eyebrow.length > BANNER_LIMITS.eyebrow ||
    title.length > BANNER_LIMITS.title ||
    cta.length > BANNER_LIMITS.cta
  ) {
    return {
      error: `Limites : surtitre ${BANNER_LIMITS.eyebrow}, titre ${BANNER_LIMITS.title}, bouton ${BANNER_LIMITS.cta} caractères.`,
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.start) || !/^\d{4}-\d{2}-\d{2}$/.test(d.end))
    return { error: 'Dates de début et de fin requises.' };
  const starts = parisMidnight(d.start);
  // la date de fin est incluse : l'encart s'arrête à minuit le lendemain
  const ends = parisMidnight(
    new Date(Date.parse(`${d.end}T12:00:00Z`) + DAY).toISOString().slice(0, 10),
  );
  if (ends <= starts) return { error: 'La fin doit être le même jour ou après le début.' };

  if (d.target_type === 'selection' ? d.productIds.length === 0 : !d.target_id) {
    return {
      error:
        d.target_type === 'selection'
          ? 'Choisissez au moins un produit pour la sélection.'
          : 'Choisissez la destination de l’encart.',
    };
  }

  // Limite d'encarts actifs simultanés (SPEC §2).
  const { data: others } = await supabase.from('banners').select('id, starts_at, ends_at');
  if (
    exceedsActiveLimit(
      (others ?? []).filter((b) => b.id !== d.id),
      { starts_at: starts.toISOString(), ends_at: ends.toISOString() },
    )
  ) {
    return {
      error: `${MAX_ACTIVE_BANNERS} encarts actifs maximum en même temps : modifiez les dates ou terminez un autre encart.`,
    };
  }

  // Flacon dessiné : celui du produit visé (ou du premier de la sélection), sinon « haut ».
  const shapeProductId =
    d.target_type === 'product'
      ? d.target_id
      : d.target_type === 'selection'
        ? d.productIds[0]
        : null;
  let shape: PlaceholderShape = 'tall';
  if (shapeProductId) {
    const { data: p } = await supabase
      .from('products')
      .select('placeholder_shape')
      .eq('id', shapeProductId)
      .maybeSingle();
    if (p) shape = p.placeholder_shape;
  }

  const row = {
    theme: d.theme,
    eyebrow,
    title,
    cta_label: cta,
    image_path: d.image_path,
    audience: d.audience,
    target_type: d.target_type,
    target_id: d.target_type === 'selection' ? null : d.target_id,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    shape,
  };
  let id = d.id;
  if (id) {
    const { error } = await supabase.from('banners').update(row).eq('id', id);
    if (error) return { error: 'L’enregistrement a échoué. Réessayez.' };
  } else {
    const { data: last } = await supabase
      .from('banners')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from('banners')
      .insert({ ...row, position: (last?.position ?? -1) + 1 })
      .select('id')
      .single();
    if (error) return { error: 'L’enregistrement a échoué. Réessayez.' };
    id = data.id;
  }

  await supabase.from('banner_products').delete().eq('banner_id', id);
  if (d.target_type === 'selection') {
    const { error } = await supabase
      .from('banner_products')
      .insert(d.productIds.map((product_id) => ({ banner_id: id!, product_id })));
    if (error) return { error: 'La sélection de produits n’a pas pu être enregistrée.' };
  }
  revalidatePath('/encarts');
  return { id };
}

export async function deleteBanner(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { data: b } = await supabase
    .from('banners')
    .select('image_path')
    .eq('id', id)
    .maybeSingle();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) return { error: 'La suppression a échoué.' };
  if (b?.image_path) await supabase.storage.from(BANNER_IMAGES_BUCKET).remove([b.image_path]);
  revalidatePath('/encarts');
  return {};
}

export async function reorderBanners(ids: string[]): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('reorder_banners', { p_ids: ids });
  if (error) return { error: 'Réordonnancement impossible.' };
  revalidatePath('/encarts');
  return {};
}

export async function searchProducts(
  query: string,
): Promise<{ id: string; reference: string; title: string }[]> {
  const { supabase } = await requireAdmin();
  const needle = query
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[%_\\]/g, '\\$&');
  let q = supabase.from('products').select('id, reference, title').order('title').limit(8);
  if (needle) q = q.ilike('search', `%${needle}%`);
  const { data } = await q;
  return data ?? [];
}
