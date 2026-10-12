import Image from 'next/image';
import { PLACEHOLDER_SVG, getProductImageUrl, placeholderShape, tokens } from '@emd/shared';
import type { ProductWithImages } from '@emd/shared';

type Props = {
  product: ProductWithImages;
  title: string;
  size?: 'thumb' | 'full';
  /** Côté du carré en px (vignette de tableau : 40). */
  dimension?: number;
  className?: string;
};

/** Seul composant qui affiche une image produit : photo si elle existe, sinon le flacon de remplacement (SPEC §6). */
export function ProductImage({
  product,
  title,
  size = 'thumb',
  dimension = 40,
  className = '',
}: Props) {
  const url = getProductImageUrl(product, size, process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
  const box = { width: dimension, height: dimension, background: tokens.color.stone };
  if (url) {
    return (
      <div className={`relative overflow-hidden rounded-badge ${className}`} style={box}>
        <Image
          src={url}
          alt={title}
          fill
          sizes={`${dimension}px`}
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }
  const shape = PLACEHOLDER_SVG[placeholderShape(product)];
  const scale = (dimension * 0.6) / shape.height;
  return (
    <div
      className={`flex items-center justify-center rounded-badge ${className}`}
      style={box}
      role="img"
      aria-label={title}
    >
      <svg
        width={shape.width * scale}
        height={shape.height * scale}
        viewBox={shape.viewBox}
        fill="none"
        stroke={tokens.color.ink}
        strokeWidth={1.5}
        strokeLinejoin="round"
        aria-hidden
      >
        {shape.shapes.map((s, i) => {
          const { tag, ...attrs } = s;
          const Tag = tag as 'rect';
          return <Tag key={i} {...attrs} />;
        })}
      </svg>
    </div>
  );
}
