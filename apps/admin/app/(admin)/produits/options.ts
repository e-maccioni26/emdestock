import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@emd/shared';

/** Marques et catégories pour les sélecteurs (catégories « Parent › Enfant »). */
export async function loadOptions(supabase: SupabaseClient<Database>) {
  const [{ data: brands }, { data: cats }] = await Promise.all([
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('categories').select('id, name, parent_id').order('position').order('name'),
  ]);
  const all = cats ?? [];
  return {
    brands: brands ?? [],
    categories: all.map((c) => {
      const parent = c.parent_id ? all.find((p) => p.id === c.parent_id) : null;
      return { id: c.id, label: parent ? `${parent.name} › ${c.name}` : c.name };
    }),
  };
}
