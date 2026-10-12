import { tokens } from './tokens';

export type StockLevel = 'ok' | 'low' | 'out';
export type Tone = 'success' | 'warning' | 'neutral' | 'error';

export const LOW_STOCK_THRESHOLD = tokens.stock.lowThreshold;

export const stockLevel = (stock: number): StockLevel =>
  stock <= 0 ? 'out' : stock < LOW_STOCK_THRESHOLD ? 'low' : 'ok';

/** Libellé côté client : « 142 en stock », « Plus que 4 », « Rupture ». */
export const stockLabel = (stock: number): string => {
  const level = stockLevel(stock);
  if (level === 'out') return tokens.stock.out.label;
  const tpl = tokens.stock[level].label;
  return tpl.replace('{n}', new Intl.NumberFormat('fr-FR').format(stock));
};

/** Libellé côté back-office : « En stock », « Stock faible », « Rupture ». */
export const stockAdminLabel = (stock: number): string => {
  const level = stockLevel(stock);
  return level === 'out'
    ? tokens.stock.out.label
    : level === 'low'
      ? tokens.stock.low.adminLabel
      : 'En stock';
};

/** Plafond du sélecteur de quantité : le stock connu. */
export const clampQuantity = (quantity: number, stock: number): number =>
  Math.max(1, Math.min(Math.floor(quantity), Math.max(stock, 1)));
