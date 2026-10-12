import { router } from 'expo-router';
import type { Banner } from '@/components/BannerCard';
import { NO_FILTERS, type Filters } from './catalog';

/** Destination d'un encart : produit, catégorie, marque (catalogue filtré) ou sélection de produits (SPEC §2). */
export function openBanner(b: Banner, setFilters: (f: Filters) => void) {
  switch (b.target_type) {
    case 'product':
      if (b.target_id) router.push({ pathname: '/produit/[id]', params: { id: b.target_id } });
      return;
    case 'category':
      setFilters({ ...NO_FILTERS, categoryIds: b.target_id ? [b.target_id] : [] });
      router.navigate('/catalogue');
      return;
    case 'brand':
      setFilters({ ...NO_FILTERS, brandIds: b.target_id ? [b.target_id] : [] });
      router.navigate('/catalogue');
      return;
    case 'selection':
      router.push({ pathname: '/selection/[id]', params: { id: b.id, title: b.title } });
  }
}
