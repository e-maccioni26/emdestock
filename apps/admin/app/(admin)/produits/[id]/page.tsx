import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { ProductForm } from '../ProductForm';
import { loadOptions } from '../options';

export default async function ModifierProduit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: p } = await supabase
    .from('products')
    .select('*, product_images(id, path, thumb_path, position)')
    .eq('id', id)
    .maybeSingle();
  if (!p) notFound();
  const { brands, categories } = await loadOptions(supabase);
  const photos = [...p.product_images].sort((a, b) => a.position - b.position);
  return (
    <ProductForm
      id={p.id}
      photos={photos}
      brands={brands}
      categories={categories}
      initial={{
        title: p.title,
        brand_id: p.brand_id ?? '',
        category_id: p.category_id ?? '',
        reference: p.reference,
        ean: p.ean,
        description: p.description ?? '',
        body: p.body ?? '',
        price_ht: String(p.price_ht).replace('.', ','),
        weight_kg: p.weight_kg === null ? '' : String(p.weight_kg).replace('.', ','),
        stock: String(p.stock),
        is_visible: p.is_visible,
        placeholder_shape: p.placeholder_shape,
      }}
    />
  );
}
