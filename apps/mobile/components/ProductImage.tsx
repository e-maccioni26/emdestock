import { View } from 'react-native';
import { Image } from 'expo-image';
import { getProductImageUrl, placeholderShape, tokens } from '@emd/shared';
import type { ProductWithImages } from '@emd/shared';
import { BottleShape } from './BottleShape';

type Props = {
  product: ProductWithImages;
  title: string;
  size?: 'thumb' | 'full';
  /** Largeur en px ; le visuel est carré (carte catalogue : 169). */
  dimension?: number;
  radius?: number;
  /** Voile blanc à 55 % pour un produit en rupture. */
  out?: boolean;
};

/** Seul composant qui affiche une image produit : photo si elle existe, sinon le flacon de remplacement (SPEC §6). */
export function ProductImage({
  product,
  title,
  size = 'thumb',
  dimension = tokens.size.mobile.productCardImage,
  radius = tokens.radius.card,
  out,
}: Props) {
  const url = getProductImageUrl(product, size, process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={title}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: radius,
        backgroundColor: tokens.color.stone,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          contentFit="contain"
          style={{ width: dimension, height: dimension }}
        />
      ) : (
        <BottleShape
          shape={placeholderShape(product)}
          height={dimension * 0.5}
          stroke={tokens.color.ink}
        />
      )}
      {out ? (
        <View
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.55)' }}
        />
      ) : null}
    </View>
  );
}
