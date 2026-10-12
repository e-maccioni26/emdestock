import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import {
  formatDayMonth,
  formatEuro,
  orderStatusLabel,
  orderStatusTone,
  tokens,
  toneColors,
} from '@emd/shared';
import { FONT, Text } from './Text';
import type { OrderSummary } from '@/lib/orders';

/** Ligne de commande de l'historique (maquette Compte) : n°, pastille de statut, date · magasin, montant. */
export function OrderRow({ order: o }: { order: OrderSummary }) {
  const tone = toneColors(orderStatusTone(o.status));
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Commande ${o.number}, ${orderStatusLabel(o.status)}, ${formatEuro(o.total_ht)} HT`}
      onPress={() => router.push({ pathname: '/mes-commandes/[id]', params: { id: o.id } })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: tokens.color.border,
      }}
    >
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="data">{o.number}</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              height: 22,
              paddingHorizontal: 8,
              borderRadius: tokens.radius.pill,
              backgroundColor: tone.bg,
            }}
          >
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tone.dot }} />
            <Text style={{ fontFamily: FONT[600], fontSize: 11, color: tone.fg }}>
              {orderStatusLabel(o.status)}
            </Text>
          </View>
        </View>
        <Text variant="secondary" style={{ color: tokens.color.textSecondary }} numberOfLines={1}>
          {formatDayMonth(o.created_at)} · {o.stores?.name}
        </Text>
      </View>
      <Text style={{ fontFamily: FONT[600], fontSize: 15, fontVariant: ['tabular-nums'] }}>
        {formatEuro(o.total_ht)}
      </Text>
      <ChevronRight size={18} strokeWidth={1.8} color={tokens.color.textSecondary} />
    </Pressable>
  );
}
