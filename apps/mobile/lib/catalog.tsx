import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useSession } from './session';

export interface Filters {
  query: string;
  categoryIds: string[];
  brandIds: string[];
  availableOnly: boolean;
}
export const NO_FILTERS: Filters = {
  query: '',
  categoryIds: [],
  brandIds: [],
  availableOnly: false,
};
export const PAGE_SIZE = 30; // SPEC §2

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}
export interface Brand {
  id: string;
  name: string;
}

// created_at doit rester dans la sélection : PostgREST refuse de trier un résultat de fonction sur une colonne non sélectionnée.
export const PRODUCT_COLUMNS =
  'id, created_at, reference, ean, title, description, body, price_ht, weight_kg, stock, placeholder_shape, brands(name), product_images(path, thumb_path, position)';

/** Recherche catalogue via la fonction SQL catalog_products (accents, casse, marque, filtres). */
export function catalogQuery(f: Filters) {
  return supabase.rpc(
    'catalog_products',
    {
      p_query: f.query,
      p_categories: f.categoryIds,
      p_brands: f.brandIds,
      p_available: f.availableOnly,
    },
    { count: 'exact' },
  );
}

interface CatalogValue {
  filters: Filters;
  setFilters: (f: Filters) => void;
  /** Nombre de filtres actifs hors recherche (pastille du bouton Filtres). */
  activeCount: number;
  categories: Category[];
  brands: Brand[];
}
const Ctx = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const access = useSession().access;
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (access !== 'active') return;
    supabase
      .from('categories')
      .select('id, name, parent_id')
      .order('position')
      .then(({ data }) => setCategories(data ?? []));
    supabase
      .from('brands')
      .select('id, name')
      .order('name')
      .then(({ data }) => setBrands(data ?? []));
  }, [access]);

  const value = useMemo<CatalogValue>(
    () => ({
      filters,
      setFilters,
      activeCount:
        filters.categoryIds.length + filters.brandIds.length + (filters.availableOnly ? 1 : 0),
      categories,
      brands,
    }),
    [filters, categories, brands],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCatalog = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCatalog hors CatalogProvider');
  return v;
};
