import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  formatDateTimeLong,
  formatEuro,
  formatNumber,
  tokens,
  type OrderStatus,
} from '@emd/shared';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/Badge';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';

const c = tokens.color;
interface Order {
  number: string;
  status: OrderStatus;
  message: string | null;
  total_ht: number;
  units: number;
  created_at: string;
  stores: { name: string; address: string; postal_code: string; city: string } | null;
  order_items: {
    id: string;
    reference: string;
    title: string;
    unit_price_ht: number;
    quantity: number;
    line_total_ht: number;
  }[];
}

// Détail d'une commande (depuis Compte et « Tout voir ») : statut relu à chaque ouverture.
export default function CommandeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(
        'number, status, message, total_ht, units, created_at, stores(name, address, postal_code, city), order_items(id, reference, title, unit_price_ht, quantity, line_total_ht)',
      )
      .eq('id', id)
      .maybeSingle()
      .overrideTypes<Order | null, { merge: false }>();
    if (error) return setState('error');
    if (!data) return setState('missing');
    setOrder(data);
    setState('ready');
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen contentStyle={{ gap: 24, paddingBottom: 24 }} onRefresh={load}>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 44 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            left: -12,
            top: 0,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} strokeWidth={2} color={c.ink} />
        </Pressable>
        <Text variant="section">Commande</Text>
      </View>
      {state === 'error' || state === 'missing' ? (
        <View style={{ gap: 8 }}>
          <Text variant="body" style={{ color: c.textSecondary }}>
            {state === 'missing'
              ? 'Cette commande est introuvable.'
              : 'Impossible de charger cette commande.'}
          </Text>
          {state === 'error' ? (
            <Button label="Réessayer" variant="secondary" compact onPress={load} />
          ) : null}
        </View>
      ) : order ? (
        <>
          <View style={{ gap: 8 }}>
            <Text variant="data" style={{ fontSize: 15 }}>
              {order.number}
            </Text>
            <StatusBadge status={order.status} />
            <Text variant="secondary" style={{ color: c.textSecondary }}>
              Passée le {formatDateTimeLong(order.created_at)}
            </Text>
          </View>
          <View
            style={{
              gap: 2,
              padding: 16,
              borderRadius: tokens.radius.block,
              backgroundColor: c.stone,
            }}
          >
            <Text variant="eyebrow" style={{ color: c.textSecondary }}>
              Livraison
            </Text>
            <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15 }}>{order.stores?.name}</Text>
            <Text variant="secondary" style={{ color: c.textSecondary }}>
              {order.stores &&
                `${order.stores.address}, ${order.stores.postal_code} ${order.stores.city}`}
            </Text>
          </View>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingBottom: 4,
              }}
            >
              <Text variant="section">Produits</Text>
              <Text variant="secondary" style={{ color: c.textSecondary }}>
                {order.order_items.length} réf. · {formatNumber(order.units)} unités
              </Text>
            </View>
            {order.order_items.map((i) => (
              <View
                key={i.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="cardTitle">{i.title}</Text>
                  <Text
                    variant="caption"
                    style={{ color: c.textSecondary, fontVariant: ['tabular-nums'] }}
                  >
                    <Text variant="data" style={{ fontSize: 12, color: c.textSecondary }}>
                      {i.reference}
                    </Text>{' '}
                    · {i.quantity} × {formatEuro(i.unit_price_ht)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: 'Geist-SemiBold',
                    fontSize: 15,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatEuro(i.line_total_ht)}
                </Text>
              </View>
            ))}
          </View>
          {order.message ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: c.textSecondary }}>
                Votre message
              </Text>
              <Text variant="body">{order.message}</Text>
            </View>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: c.ink,
            }}
          >
            <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15 }}>Total estimé</Text>
            <Text variant="price">
              {formatEuro(order.total_ht)}{' '}
              <Text style={{ fontSize: 13, fontFamily: 'Geist-Medium', color: c.textSecondary }}>
                HT
              </Text>
            </Text>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
