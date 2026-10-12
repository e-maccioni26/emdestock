export type StatsPeriod = 'week' | 'month' | 'year';

export interface StatsTotals {
  orders: number;
  units: number;
  total_ht: number;
  active_clients: number;
}
export interface AdminStats {
  period: StatsPeriod;
  period_start: string;
  current: StatsTotals;
  previous: StatsTotals;
  series: { bucket: string; orders: number }[];
  top_products: { product_id: string; title: string; reference: string; units: number }[];
  top_stores: { id: string; name: string; legal_name: string; orders: number; total_ht: number }[];
}

/** Évolution en % ; null si la période précédente est vide (pas de base de comparaison). */
export const percentChange = (current: number, previous: number): number | null =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 100);

export type DeltaTone = 'up' | 'down' | 'flat' | 'none';
export const deltaTone = (d: number | null): DeltaTone =>
  d === null ? 'none' : d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
export const formatDelta = (d: number | null, suffix = ' %'): string =>
  d === null ? '—' : `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)}${suffix}`;

/** Numéro de semaine ISO d'une date « AAAA-MM-JJ ». */
export const isoWeek = (date: string): number => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); // jeudi de la semaine
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400_000 + 1) / 7);
};

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

/** Étiquette d'axe : « Lun » (jour), « S36 » (semaine ISO), « Fév » (mois). */
export const bucketLabel = (period: StatsPeriod, bucket: string): string => {
  const [y, m, d] = bucket.split('-').map(Number) as [number, number, number];
  if (period === 'week') return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
  if (period === 'month') return `S${isoWeek(bucket)}`;
  return MONTHS[m - 1]!;
};

const monthFmt = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayMonthFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Semaine du 28 sept., par jour », « Septembre 2026, par semaine », « 2026, par mois ». */
export const periodLabel = (period: StatsPeriod, periodStart: string): string => {
  const d = new Date(`${periodStart}T12:00:00Z`);
  if (period === 'week') return `Semaine du ${dayMonthFmt.format(d)}, par jour`;
  if (period === 'month') return `${capitalize(monthFmt.format(d))}, par semaine`;
  return `${d.getUTCFullYear()}, par mois`;
};
export const periodMonthLabel = (periodStart: string): string =>
  capitalize(monthFmt.format(new Date(`${periodStart}T12:00:00Z`)));

/** « il y a 5 min », « il y a 3 h », « hier », sinon « 28 sept. ». */
export const formatRelative = (d: Date | string, now: Date = new Date()): string => {
  const date = new Date(d);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  if (hours < 48) return 'hier';
  return dayMonthFmt.format(date);
};
