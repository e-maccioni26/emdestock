import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { OrderStatus } from '@emd/shared';
import { supabase } from './supabase';

export interface OrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  total_ht: number;
  units: number;
  created_at: string;
  stores: { name: string } | null;
}

const COLUMNS = 'id, number, status, total_ht, units, created_at, stores(name)';

/** Commandes du client, lues à l'ouverture de l'écran et au retour sur l'app (pas de push en V1, SPEC §2). */
export function useOrders(pageSize: number) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(
    async (from: number) => {
      const { data, error } = await supabase
        .from('orders')
        .select(COLUMNS)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize)
        .overrideTypes<OrderSummary[], { merge: false }>();
      if (error) return setState('error');
      const rows = data ?? [];
      setHasMore(rows.length > pageSize);
      setOrders((prev) =>
        from === 0 ? rows.slice(0, pageSize) : [...prev, ...rows.slice(0, pageSize)],
      );
      setState('ready');
    },
    [pageSize],
  );

  useFocusEffect(
    useCallback(() => {
      load(0);
    }, [load]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load(0));
    return () => sub.remove();
  }, [load]);

  return { orders, state, hasMore, reload: () => load(0), more: () => load(orders.length) };
}
