import { View } from 'react-native';
import {
  orderStatusLabel,
  orderStatusTone,
  stockLabel,
  stockLevel,
  tokens,
  toneColors,
} from '@emd/shared';
import type { OrderStatus } from '@emd/shared';
import { FONT, Text } from './Text';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = toneColors(orderStatusTone(status));
  return (
    <View
      accessible
      accessibilityLabel={orderStatusLabel(status)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        height: 24,
        paddingHorizontal: 10,
        borderRadius: tokens.radius.pill,
        backgroundColor: c.bg,
      }}
    >
      <View
        style={{ width: 6, height: 6, borderRadius: tokens.radius.pill, backgroundColor: c.dot }}
      />
      <Text style={{ fontFamily: FONT[600], fontSize: 12, color: c.fg }}>
        {orderStatusLabel(status)}
      </Text>
    </View>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock);
  const c =
    level === 'out'
      ? tokens.stock.out
      : toneColors(tokens.stock[level].tone as 'success' | 'warning');
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        justifyContent: 'center',
        height: 22,
        paddingHorizontal: 8,
        borderRadius: tokens.radius.badge,
        backgroundColor: c.bg,
      }}
    >
      <Text
        style={{ fontFamily: FONT[600], fontSize: 11, color: c.fg, fontVariant: ['tabular-nums'] }}
      >
        {stockLabel(stock)}
      </Text>
    </View>
  );
}
