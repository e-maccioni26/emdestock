import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { formatEuro, tokens } from '@emd/shared';
import { ProductImage } from './ProductImage';
import { FONT, Text } from './Text';
import type { ProductRow } from './ProductCard';

/** Vignette produit des rangées de l'accueil (140 px, maquette Accueil). */
export function ProductMini({ product: p }: { product: ProductRow }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${p.title}, ${formatEuro(p.price_ht)} HT`}
      onPress={() => router.push({ pathname: '/produit/[id]', params: { id: p.id } })}
      style={{ width: 140, gap: 8 }}
    >
      <ProductImage product={p} title={p.title} dimension={140} out={p.stock === 0} />
      <Text variant="eyebrow" style={{ color: tokens.color.textSecondary }} numberOfLines={1}>
        {p.brands?.name ?? ' '}
      </Text>
      <Text variant="cardTitle" numberOfLines={2}>
        {p.title}
      </Text>
      <Text style={{ fontFamily: FONT[600], fontSize: 14, fontVariant: ['tabular-nums'] }}>
        {formatEuro(p.price_ht)}
      </Text>
    </Pressable>
  );
}
