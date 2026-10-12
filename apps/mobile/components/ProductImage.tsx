import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { PLACEHOLDER_SVG, getProductImageUrl, placeholderShape, tokens } from '@emd/shared';
import type { ProductWithImages } from '@emd/shared';

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
  const shape = PLACEHOLDER_SVG[placeholderShape(product)];
  const scale = (dimension * 0.5) / shape.height;
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
        <Svg
          width={shape.width * scale}
          height={shape.height * scale}
          viewBox={shape.viewBox}
          fill="none"
          stroke={tokens.color.ink}
          strokeWidth={1.5}
          strokeLinejoin="round"
        >
          {shape.shapes.map((s, i) => {
            if (s.tag === 'rect')
              return (
                <Rect
                  key={i}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  rx={'rx' in s ? s.rx : undefined}
                />
              );
            if (s.tag === 'circle') return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
            if (s.tag === 'line') return <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />;
            return <Path key={i} d={s.d} />;
          })}
        </Svg>
      )}
      {out ? (
        <View
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.55)' }}
        />
      ) : null}
    </View>
  );
}
