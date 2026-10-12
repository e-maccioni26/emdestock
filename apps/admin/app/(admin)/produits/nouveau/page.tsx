import { requireAdmin } from '@/lib/auth';
import { EMPTY, ProductForm } from '../ProductForm';
import { loadOptions } from '../options';

export default async function NouveauProduit() {
  const { supabase } = await requireAdmin();
  const { brands, categories } = await loadOptions(supabase);
  return (
    <ProductForm id={null} initial={EMPTY} photos={[]} brands={brands} categories={categories} />
  );
}
