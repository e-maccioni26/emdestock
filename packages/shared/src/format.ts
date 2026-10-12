const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const num = new Intl.NumberFormat('fr-FR');

// Intl insère des espaces insécables (U+00A0 / U+202F) ; on les garde pour éviter les retours à la ligne.
export const formatEuro = (value: number): string => eur.format(value);
export const formatNumber = (value: number): string => num.format(value);

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Paris',
});
const longFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
});
const timeFmt = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris',
});

export const formatDate = (d: Date | string): string => dateFmt.format(new Date(d));
export const formatDateLong = (d: Date | string): string => longFmt.format(new Date(d));
export const formatTime = (d: Date | string): string => timeFmt.format(new Date(d));

/** SIRET affiché par groupes : 909 639 668 00013. */
export const formatSiret = (siret: string): string =>
  siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4');

/** CMD-AAAA-NNNN, identique à la numérotation de la fonction SQL place_order. */
export const formatOrderNumber = (year: number, seq: number): string =>
  `CMD-${year}-${String(seq).padStart(4, '0')}`;
