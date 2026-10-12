import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { OrderStatus } from '@emd/shared';
import type { Banner } from '@/components/BannerCard';
import type { ProductRow } from '@/components/ProductCard';
import { NO_FILTERS, PRODUCT_COLUMNS, catalogQuery, type Category } from './catalog';
import { supabase } from './supabase';

export interface LastOrder {
  id: string;
  number: string;
  status: OrderStatus;
  total_ht: number;
  created_at: string;
  stores: { name: string } | null;
  order_items: { count: number }[];
}
export interface HomeData {
  banners: Banner[];
  /** Au moins une commande non annulée : même règle que l'audience des encarts (my_banners). */
  hasOrdered: boolean;
  lastOrder: LastOrder | null;
  productsTitle: string;
  products: ProductRow[];
  categories: (Category & { count: number })[];
}

async function latestProducts(limit: number) {
  const { data } = await catalogQuery(NO_FILTERS)
    .select(PRODUCT_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id')
    .range(0, limit - 1)
    .overrideTypes<ProductRow[], { merge: false }>();
  return data ?? [];
}

async function loadHome(): Promise<HomeData> {
  const [{ data: banners, error }, { data: last }, { data: cats }] = await Promise.all([
    supabase.rpc('my_banners').overrideTypes<Banner[], { merge: false }>(),
    supabase
      .from('orders')
      .select('id, number, status, total_ht, created_at, stores(name), order_items(count)')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .overrideTypes<LastOrder | null, { merge: false }>(),
    supabase
      .from('categories')
      .select('id, name, parent_id')
      .is('parent_id', null)
      .order('position'),
  ]);
  if (error) throw error;
  const hasOrdered = last !== null;

  let products: ProductRow[] = [];
  let productsTitle = 'Nouveaux arrivages';
  if (!hasOrdered) {
    const { data: top } = await supabase.rpc('top_ordered_products', { p_limit: 8 });
    const ids = (top ?? []).map((t) => t.product_id);
    if (ids.length) {
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .in('id', ids)
        .overrideTypes<ProductRow[], { merge: false }>();
      products = ids.flatMap((id) => data?.find((p) => p.id === id) ?? []); // ordre du classement
      productsTitle = 'Les plus commandés';
    }
  }
  if (products.length === 0) products = await latestProducts(8);

  const categories = await Promise.all(
    (cats ?? []).map(async (c) => ({
      ...c,
      count:
        (
          await catalogQuery({ ...NO_FILTERS, categoryIds: [c.id] })
            .select('id')
            .range(0, 0)
        ).count ?? 0,
    })),
  );
  return {
    banners: banners ?? [],
    hasOrdered,
    lastOrder: last,
    productsTitle,
    products,
    categories,
  };
}

/** Données de l'accueil, relues à chaque retour sur l'écran. */
export function useHome() {
  const [data, setData] = useState<HomeData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const reload = useCallback(async () => {
    try {
      setData(await loadHome());
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  // Encarts modifiés dans le back-office : relecture immédiate (Realtime), regroupée car une
  // sauvegarde touche plusieurs tables ; et au retour sur l'app (les dates d'un encart programmé).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(reload, 400);
    };
    const channel = supabase
      .channel('home-banners')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_versions', filter: 'key=eq.banners' },
        soon,
      )
      .subscribe();
    const app = AppState.addEventListener('change', (s) => s === 'active' && reload());
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
      app.remove();
    };
  }, [reload]);
  return { data, state, reload };
}
