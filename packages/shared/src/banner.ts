import { tokens } from './tokens';

export type BannerTheme = keyof typeof tokens.bannerTheme;
export type BannerTarget = 'product' | 'category' | 'brand' | 'selection';
export type BannerAudience = 'new' | 'all';
export type BannerStatus = 'scheduled' | 'active' | 'ended';

export const MAX_ACTIVE_BANNERS = 5; // SPEC §2
export const BANNER_IMAGES_BUCKET = 'banner-images';

export const BANNER_LIMITS = { eyebrow: 40, title: 60, cta: 24 } as const;

/** Programmé / Actif / Terminé : `starts_at ≤ maintenant < ends_at` est actif. */
export const bannerStatus = (
  b: { starts_at: string; ends_at: string },
  now: Date = new Date(),
): BannerStatus => {
  const t = now.getTime();
  if (t < new Date(b.starts_at).getTime()) return 'scheduled';
  return t < new Date(b.ends_at).getTime() ? 'active' : 'ended';
};

export const bannerStatusLabel = (s: BannerStatus): string =>
  ({ scheduled: 'Programmé', active: 'Actif', ended: 'Terminé' })[s];
export const bannerStatusTone = (s: BannerStatus) =>
  (s === 'active' ? 'success' : 'neutral') as 'success' | 'neutral';

export const getBannerImageUrl = (path: string | null, supabaseUrl: string): string | null =>
  path ? `${supabaseUrl}/storage/v1/object/public/${BANNER_IMAGES_BUCKET}/${path}` : null;

/** Plus grand nombre d'intervalles [début, fin[ simultanés. */
export const maxConcurrent = (intervals: { start: number; end: number }[]): number => {
  const events = intervals.flatMap((i) => [
    { t: i.start, d: 1 },
    { t: i.end, d: -1 },
  ]);
  // à égalité, les fins passent avant les débuts : [a, b[ et [b, c[ ne se chevauchent pas
  events.sort((a, b) => a.t - b.t || a.d - b.d);
  let current = 0;
  let max = 0;
  for (const e of events) {
    current += e.d;
    max = Math.max(max, current);
  }
  return max;
};

/** Le nouvel encart dépasse-t-il la limite d'encarts actifs simultanés ? */
export const exceedsActiveLimit = (
  others: { starts_at: string; ends_at: string }[],
  candidate: { starts_at: string; ends_at: string },
): boolean =>
  maxConcurrent(
    [...others, candidate].map((b) => ({
      start: new Date(b.starts_at).getTime(),
      end: new Date(b.ends_at).getTime(),
    })),
  ) > MAX_ACTIVE_BANNERS;

const PARIS = 'Europe/Paris';
const parisParts = (d: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: PARIS,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

/** « 2026-10-12 » → instant du minuit à Paris (gère l'heure d'été). */
export const parisMidnight = (date: string): Date => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d);
  const p = parisParts(new Date(guess));
  const asParis = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return new Date(guess - (asParis - guess));
};

/** Instant → « 2026-10-12 » (date à Paris), pour les champs date du back-office. */
export const toParisDate = (d: Date | string): string => {
  const p = parisParts(new Date(d));
  return `${p.year}-${p.month}-${p.day}`;
};
