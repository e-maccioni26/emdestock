import { requireAdmin } from '@/lib/auth';
import { EMPTY, ProductForm } from '../ProductForm';
import { loadClients, loadOptions } from '../options';

export default async function NouveauProduit() {
  const { supabase } = await requireAdmin();
  const [{ brands, categories }, clients] = await Promise.all([
    loadOptions(supabase),
    loadClients(supabase),
  ]);
  return (
    <ProductForm
      id={null}
      initial={EMPTY}
      photos={[]}
      brands={brands}
      categories={categories}
      clients={clients}
      excluded={[]}
    />
  );
}
