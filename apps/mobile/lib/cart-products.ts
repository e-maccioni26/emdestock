import { useEffect, useState } from 'react';
import type { PlaceholderShape } from '@emd/shared';
import { PRODUCT_COLUMNS } from './catalog';
import { supabase } from './supabase';
import type { CartLine } from './cart';

export interface CartProduct {
  id: string;
  reference: string;
  title: string;
  price_ht: number;
  stock: number;
  placeholder_shape: PlaceholderShape;
  brands: { name: string } | null;
  product_images: { path: string; thumb_path: string | null; position: number }[];
}

/** Produits du panier. Un produit masqué ou supprimé n'est plus renvoyé (RLS) : la ligne est alors indisponible. */
export function useCartProducts(lines: CartLine[]) {
  const [products, setProducts] = useState<Record<string, CartProduct>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const key = lines
    .map((l) => l.productId)
    .sort()
    .join(',');

  useEffect(() => {
    if (!key) {
      setProducts({});
      return setState('ready');
    }
    let cancelled = false;
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .in('id', key.split(','))
      .overrideTypes<CartProduct[], { merge: false }>()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return setState('error');
        setProducts(Object.fromEntries((data ?? []).map((p) => [p.id, p])));
        setState('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { products, state };
}
