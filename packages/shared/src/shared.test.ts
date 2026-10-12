import { describe, expect, it } from 'vitest';
import {
  clampQuantity,
  formatEuro,
  formatOrderNumber,
  formatSiret,
  getProductImageUrl,
  isValidEan13,
  orderStatusLabel,
  placeholderShape,
  stockAdminLabel,
  stockLabel,
  stockLevel,
} from './index';

const nbsp = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('formatage', () => {
  it('euros HT au format français', () => {
    expect(nbsp(formatEuro(1126.4))).toBe('1 126,40 €');
    expect(nbsp(formatEuro(7.2))).toBe('7,20 €');
  });
  it('numéro de commande', () => expect(formatOrderNumber(2026, 7)).toBe('CMD-2026-0007'));
  it('SIRET', () => expect(formatSiret('90963966800013')).toBe('909 639 668 00013'));
});

describe('stock', () => {
  it('seuils', () => {
    expect(stockLevel(0)).toBe('out');
    expect(stockLevel(1)).toBe('low');
    expect(stockLevel(9)).toBe('low');
    expect(stockLevel(10)).toBe('ok');
  });
  it('libellés client', () => {
    expect(stockLabel(0)).toBe('Rupture');
    expect(stockLabel(4)).toBe('Plus que 4');
    expect(nbsp(stockLabel(142))).toBe('142 en stock');
  });
  it('libellés admin', () => {
    expect(stockAdminLabel(4)).toBe('Stock faible');
    expect(stockAdminLabel(50)).toBe('En stock');
  });
  it('quantité plafonnée au stock', () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(50, 10)).toBe(10);
    expect(clampQuantity(3, 10)).toBe(3);
  });
});

describe('EAN-13', () => {
  it('clé de contrôle', () => {
    expect(isValidEan13('3760123456784')).toBe(true);
    expect(isValidEan13('3760123456789')).toBe(false);
    expect(isValidEan13('376012345678')).toBe(false);
    expect(isValidEan13('abcdefghijklm')).toBe(false);
  });
});

describe('statuts', () => {
  it('libellés', () => expect(orderStatusLabel('preparing')).toBe('En préparation'));
});

describe('ProductImage', () => {
  const url = 'http://x';
  it('null sans photo, forme par défaut tall', () => {
    expect(getProductImageUrl({ product_images: [] }, 'thumb', url)).toBeNull();
    expect(placeholderShape({})).toBe('tall');
  });
  it('première position, vignette avec repli sur l’original', () => {
    const p = {
      product_images: [
        { path: 'b.jpg', thumb_path: null, position: 1 },
        { path: 'a.jpg', thumb_path: 'a-400.jpg', position: 0 },
      ],
    };
    expect(getProductImageUrl(p, 'thumb', url)).toBe(
      'http://x/storage/v1/object/public/product-images/a-400.jpg',
    );
    expect(getProductImageUrl(p, 'full', url)).toBe(
      'http://x/storage/v1/object/public/product-images/a.jpg',
    );
    expect(
      getProductImageUrl(
        { product_images: [{ path: 'c.jpg', thumb_path: null, position: 0 }] },
        'thumb',
        url,
      ),
    ).toContain('c.jpg');
  });
});
