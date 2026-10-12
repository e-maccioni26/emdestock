import { requireAdmin } from '@/lib/auth';
import { loadOptions } from '../produits/options';
import { BannersEditor, type BannerRow } from './BannersEditor';

export default async function Encarts() {
  const { supabase } = await requireAdmin();
  const [{ data: banners }, { brands, categories }] = await Promise.all([
    supabase
      .from('banners')
      .select(
        'id, theme, eyebrow, title, cta_label, image_path, target_type, target_id, audience, starts_at, ends_at, position, shape, banner_products(product_id, products(reference, title))',
      )
      .order('position'),
    loadOptions(supabase),
  ]);

  const rows: BannerRow[] = (banners ?? []).map((b) => ({
    id: b.id,
    theme: b.theme,
    eyebrow: b.eyebrow,
    title: b.title,
    cta_label: b.cta_label,
    image_path: b.image_path,
    target_type: b.target_type,
    target_id: b.target_id,
    audience: b.audience,
    starts_at: b.starts_at,
    ends_at: b.ends_at,
    shape: b.shape,
    products: b.banner_products.map((p) => ({
      id: p.product_id,
      reference: p.products?.reference ?? '',
      title: p.products?.title ?? '',
    })),
  }));

  // Libellé de la destination « produit » : un seul produit par encart.
  const productIds = rows
    .filter((r) => r.target_type === 'product' && r.target_id)
    .map((r) => r.target_id!);
  const { data: targets } = productIds.length
    ? await supabase.from('products').select('id, reference, title').in('id', productIds)
    : { data: [] };

  return (
    <BannersEditor
      banners={rows}
      brands={brands}
      categories={categories}
      productTargets={targets ?? []}
    />
  );
}
