/** Mot de passe : 12 caractères minimum dont un chiffre (SPEC §2). Retourne le message d'erreur ou null. */
export const validatePassword = (password: string): string | null => {
  if (password.length < 12) return 'Au moins 12 caractères, dont un chiffre.';
  if (!/\d/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.';
  return null;
};

/** Retire espaces et séparateurs : « 909 639 668 00013 » → « 90963966800013 ». */
export const normalizeSiret = (input: string): string => input.replace(/[\s.-]/g, '');

/**
 * SIRET valide : 14 chiffres, clé de Luhn. Exception La Poste (SIREN 356000000) : somme des chiffres multiple de 5 acceptée.
 */
export const isValidSiret = (input: string): boolean => {
  const siret = normalizeSiret(input);
  if (!/^\d{14}$/.test(siret)) return false;
  const digits = [...siret].map(Number);
  const sum = digits.reduce((acc, d, i) => {
    if (i % 2 === 0) {
      const doubled = d * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + d;
  }, 0);
  if (sum % 10 === 0) return true;
  return siret.startsWith('356000000') && digits.reduce((a, b) => a + b, 0) % 5 === 0;
};

export const SIRET_ALREADY_REGISTERED = 'Ce SIRET est déjà inscrit. Contactez EMD DESTOCK.';

export type VerifySiretCode =
  | 'invalid_format'
  | 'not_found'
  | 'inactive'
  | 'already_registered'
  | 'unavailable'
  | 'rate_limited';

export const verifySiretMessage = (code: VerifySiretCode): string =>
  ({
    invalid_format: 'Le SIRET doit contenir 14 chiffres valides.',
    not_found: 'Ce SIRET est introuvable dans la base Sirene.',
    inactive: 'Cet établissement n’est plus actif.',
    already_registered: SIRET_ALREADY_REGISTERED,
    unavailable: 'Vérification impossible pour le moment. Réessayez dans quelques instants.',
    rate_limited: 'Trop de vérifications. Réessayez dans une heure ou contactez EMD DESTOCK.',
  })[code];

export interface VerifySiretCompany {
  legal_name: string;
  address: string;
  postal_code: string;
  city: string;
}
export type VerifySiretResponse =
  { ok: true; siret: string; company: VerifySiretCompany } | { ok: false; code: VerifySiretCode };

/** Message affiché pour une erreur de la fonction SQL register_company. */
export const registerErrorMessage = (error: { code?: string; message?: string }): string => {
  if (error.code === '23505') return SIRET_ALREADY_REGISTERED;
  if (error.message === 'already_registered') return 'Ce compte a déjà une demande en cours.';
  return 'L’envoi de la demande a échoué. Réessayez.';
};

/** Destination selon le statut de l'entreprise et le rôle (SPEC §2). */
export type AccessState = 'active' | 'pending' | 'suspended' | 'blocked';
export const accessState = (profile: {
  role: string;
  company_status: string | null;
}): AccessState => {
  if (profile.role !== 'client') return 'blocked';
  switch (profile.company_status) {
    case 'active':
      return 'active';
    case 'suspended':
      return 'suspended';
    case 'pending':
    case 'refused':
      return 'pending'; // refus : message neutre, pas de distinction côté client
    default:
      return 'blocked';
  }
};
