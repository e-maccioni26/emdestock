export type PlaceholderShape = 'tall' | 'round' | 'tube';
export type ProductImageSize = 'thumb' | 'full';

export interface ProductWithImages {
  placeholder_shape?: PlaceholderShape | null;
  product_images?: { path: string; thumb_path: string | null; position: number }[] | null;
}

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/** URL publique de la photo de position la plus basse, ou null (→ visuel de remplacement). */
export const getProductImageUrl = (
  product: ProductWithImages,
  size: ProductImageSize,
  supabaseUrl: string,
): string | null => {
  const first = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
  if (!first) return null;
  const path = size === 'thumb' ? (first.thumb_path ?? first.path) : first.path;
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
};

export const placeholderShape = (product: ProductWithImages): PlaceholderShape =>
  product.placeholder_shape ?? 'tall';

/** Tracés SVG des trois flacons (repris de Catalogue.html), partagés par les deux apps. */
export const PLACEHOLDER_SVG = {
  tall: {
    width: 56,
    height: 84,
    viewBox: '0 0 64 96',
    shapes: [
      { tag: 'rect', x: 24, y: 4, width: 16, height: 14, rx: 2 },
      { tag: 'rect', x: 28, y: 18, width: 8, height: 8 },
      { tag: 'rect', x: 10, y: 26, width: 44, height: 64, rx: 6 },
      { tag: 'line', x1: 18, y1: 58, x2: 46, y2: 58 },
    ],
  },
  round: {
    width: 63,
    height: 84,
    viewBox: '0 0 72 96',
    shapes: [
      { tag: 'rect', x: 27, y: 4, width: 18, height: 12, rx: 2 },
      { tag: 'rect', x: 31, y: 16, width: 10, height: 10 },
      { tag: 'circle', cx: 36, cy: 60, r: 32 },
    ],
  },
  tube: {
    width: 42,
    height: 84,
    viewBox: '0 0 48 96',
    shapes: [
      { tag: 'path', d: 'M8 6h32l-5 70H13z' },
      { tag: 'rect', x: 16, y: 76, width: 16, height: 14, rx: 2 },
      { tag: 'line', x1: 12, y1: 20, x2: 36, y2: 20 },
    ],
  },
} as const;
