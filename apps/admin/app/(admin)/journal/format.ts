import { formatDateTimeLong, formatEuro, orderStatusLabel, type OrderStatus } from '@emd/shared';

export const ENTITY_LABELS: Record<string, string> = {
  product: 'Produit',
  product_image: 'Photo',
  product_visibility: 'Visibilité client',
  brand: 'Marque',
  category: 'Catégorie',
  company: 'Client',
  store: 'Magasin',
  banner: 'Encart',
  banner_selection: 'Sélection d’encart',
  order: 'Commande',
  profile: 'Contact client',
  admin_account: 'Compte admin',
};

export const ACTION_LABELS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  disable: 'Désactivation',
  enable: 'Réactivation',
  reset_password: 'Nouveau mot de passe',
  delete_account: 'Suppression du compte',
};

const COLUMNS: Record<string, string> = {
  title: 'Titre',
  reference: 'Référence',
  ean: 'EAN',
  price_ht: 'Prix HT',
  stock: 'Stock',
  is_visible: 'Visible',
  brand_id: 'Marque',
  category_id: 'Catégorie',
  parent_id: 'Catégorie parente',
  description: 'Description',
  body: 'Texte produit',
  weight_kg: 'Poids (kg)',
  placeholder_shape: 'Visuel de remplacement',
  name: 'Nom',
  legal_name: 'Raison sociale',
  siret: 'SIRET',
  address: 'Adresse',
  postal_code: 'Code postal',
  city: 'Ville',
  phone: 'Téléphone',
  status: 'Statut',
  is_former_client: 'Ancien client',
  validated_at: 'Validé le',
  archived_at: 'Archivé le',
  first_name: 'Prénom',
  last_name: 'Nom',
  email: 'E-mail',
  eyebrow: 'Surtitre',
  cta_label: 'Bouton',
  theme: 'Fond',
  audience: 'Audience',
  starts_at: 'Début',
  ends_at: 'Fin',
  position: 'Position',
  target_type: 'Destination',
  target_id: 'Cible',
  image_path: 'Image',
  shape: 'Flacon',
  can_manage_team: 'Gestionnaire d’équipe',
  produits: 'Produits',
};

const COMPANY_STATUS: Record<string, string> = {
  pending: 'En attente',
  active: 'Actif',
  suspended: 'Suspendu',
  refused: 'Refusé',
  deleted: 'Supprimé',
};

/** Colonnes dont la valeur est un identifiant illisible : on affiche « modifié » sans valeurs. */
const OPAQUE = new Set(['brand_id', 'category_id', 'parent_id', 'target_id', 'image_path']);

function value(entity: string, key: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (key === 'price_ht' || key === 'unit_price_ht') return formatEuro(Number(v));
  if (key === 'status')
    return entity === 'order'
      ? orderStatusLabel(v as OrderStatus)
      : (COMPANY_STATUS[String(v)] ?? String(v));
  if (key.endsWith('_at')) return formatDateTimeLong(String(v));
  return String(v);
}

/** Lignes lisibles d'une modification : « Prix HT : 38,50 € → 40,00 € ». Rien pour une création ou une suppression. */
export function describeChanges(entity: string, action: string, changes: unknown): string[] {
  if (action !== 'update' || !changes || typeof changes !== 'object') return [];
  return Object.entries(changes as Record<string, [unknown, unknown]>).map(([k, pair]) => {
    const label = COLUMNS[k] ?? k;
    if (OPAQUE.has(k) || !Array.isArray(pair)) return `${label} modifié`;
    return `${label} : ${value(entity, k, pair[0])} → ${value(entity, k, pair[1])}`;
  });
}

/** Page de l'élément concerné, quand elle existe. */
export function entityHref(entity: string, id: string | null): string | null {
  if (!id) return null;
  if (entity === 'product') return `/produits/${id}`;
  if (entity === 'company') return `/clients/${id}`;
  if (entity === 'order') return `/commandes/${id}`;
  return null;
}
