import { describe, expect, it } from 'vitest';
import {
  bannerStatus,
  exceedsActiveLimit,
  maxConcurrent,
  parisMidnight,
  toParisDate,
  formatDayMonth,
  formatDateTimeLong,
  formatShortDateTime,
  SIRET_ALREADY_REGISTERED,
  accessState,
  isValidSiret,
  normalizeSiret,
  registerErrorMessage,
  validatePassword,
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
  it('dates de commande (Europe/Paris)', () => {
    expect(formatShortDateTime('2026-10-01T08:42:00Z')).toBe('01/10 · 10:42');
    expect(formatDateTimeLong('2026-10-01T08:42:00Z')).toBe('1 oct. 2026 à 10:42');
    expect(formatDayMonth('2026-09-28T08:42:00Z')).toBe('28 sept.');
  });
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

describe('auth', () => {
  it('mot de passe', () => {
    expect(validatePassword('court1')).not.toBeNull();
    expect(validatePassword('sansaucunchiffre')).not.toBeNull();
    expect(validatePassword('douzecaracteres1')).toBeNull();
  });
  it('SIRET (Luhn + La Poste)', () => {
    expect(isValidSiret('909 639 668 00013')).toBe(true); // exemple des maquettes
    expect(isValidSiret('12345678901234')).toBe(false);
    expect(isValidSiret('35600000000048')).toBe(true); // La Poste
    expect(isValidSiret('73282932000074')).toBe(true);
    expect(isValidSiret('1234')).toBe(false);
    expect(normalizeSiret('732 829 320 00074')).toBe('73282932000074');
  });
  it('erreurs et accès', () => {
    expect(registerErrorMessage({ code: '23505' })).toBe(SIRET_ALREADY_REGISTERED);
    expect(accessState({ role: 'client', company_status: 'active' })).toBe('active');
    expect(accessState({ role: 'client', company_status: 'refused' })).toBe('pending');
    expect(accessState({ role: 'client', company_status: 'suspended' })).toBe('suspended');
    expect(accessState({ role: 'admin', company_status: null })).toBe('blocked');
  });
});

describe('encarts', () => {
  const b = (start: string, end: string) => ({ starts_at: start, ends_at: end });
  it('statut calculé', () => {
    const now = new Date('2026-10-12T10:00:00Z');
    expect(bannerStatus(b('2026-10-13T00:00:00Z', '2026-10-20T00:00:00Z'), now)).toBe('scheduled');
    expect(bannerStatus(b('2026-10-01T00:00:00Z', '2026-10-20T00:00:00Z'), now)).toBe('active');
    expect(bannerStatus(b('2026-10-01T00:00:00Z', '2026-10-12T10:00:00Z'), now)).toBe('ended'); // fin exclue
    expect(bannerStatus(b('2026-10-12T10:00:00Z', '2026-10-20T00:00:00Z'), now)).toBe('active'); // début inclus
  });
  it('limite de 5 encarts actifs simultanés', () => {
    const five = Array.from({ length: 5 }, () => b('2026-10-01T00:00:00Z', '2026-10-31T00:00:00Z'));
    expect(
      exceedsActiveLimit(five.slice(0, 4), b('2026-10-10T00:00:00Z', '2026-10-20T00:00:00Z')),
    ).toBe(false);
    expect(exceedsActiveLimit(five, b('2026-10-10T00:00:00Z', '2026-10-20T00:00:00Z'))).toBe(true);
    // 5 existants mais pas en même temps : un sixième ne dépasse pas la limite
    const seq = [1, 2, 3, 4, 5].map((i) => b(`2026-0${i}-01T00:00:00Z`, `2026-0${i}-28T00:00:00Z`));
    expect(exceedsActiveLimit(seq, b('2026-10-01T00:00:00Z', '2026-10-20T00:00:00Z'))).toBe(false);
    // intervalles accolés : pas de chevauchement
    expect(
      maxConcurrent([
        { start: 0, end: 10 },
        { start: 10, end: 20 },
      ]),
    ).toBe(1);
  });
  it('dates à Paris, heure d’été comprise', () => {
    expect(parisMidnight('2026-07-14').toISOString()).toBe('2026-07-13T22:00:00.000Z');
    expect(parisMidnight('2026-12-25').toISOString()).toBe('2026-12-24T23:00:00.000Z');
    expect(toParisDate('2026-07-13T22:30:00Z')).toBe('2026-07-14');
  });
});
