import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { formatEuro, stockLevel, tokens, type PlaceholderShape } from '@emd/shared';
import { StockBadge } from './Badge';
import { ProductImage } from './ProductImage';
import { Text } from './Text';

export interface ProductRow {
  id: string;
  reference: string;
  title: string;
  price_ht: number;
  stock: number;
  placeholder_shape: PlaceholderShape;
  brands: { name: string } | null;
  product_images: { path: string; thumb_path: string | null; position: number }[];
}

/** Carte produit du catalogue (maquette Catalogue) : image carrée, marque, titre 2 lignes, réf., prix et stock. */
export function ProductCard({ product: p, width }: { product: ProductRow; width: number }) {
  const out = stockLevel(p.stock) === 'out';
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${p.title}, ${formatEuro(p.price_ht)} HT`}
      onPress={() => router.push({ pathname: '/produit/[id]', params: { id: p.id } })}
      style={{ width, gap: 10 }}
    >
      <ProductImage product={p} title={p.title} dimension={width} out={out} />
      <View style={{ gap: 4 }}>
        <Text variant="eyebrow" style={{ color: tokens.color.textSecondary }} numberOfLines={1}>
          {p.brands?.name ?? ' '}
        </Text>
        <Text variant="cardTitle" numberOfLines={2} style={{ height: 38 }}>
          {p.title}
        </Text>
        <Text
          variant="data"
          style={{ fontSize: 11, lineHeight: 14, color: tokens.color.textSecondary }}
        >
          {p.reference}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Text
          style={{
            fontFamily: 'Geist-SemiBold',
            fontSize: 15,
            lineHeight: 20,
            fontVariant: ['tabular-nums'],
            color: out ? tokens.color.textSecondary : tokens.color.ink,
          }}
        >
          {formatEuro(p.price_ht)}
        </Text>
        <StockBadge stock={p.stock} />
      </View>
    </Pressable>
  );
}
