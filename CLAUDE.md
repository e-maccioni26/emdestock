# EMD DESTOCK : consignes pour Claude Code

Tu développes deux applications pour EMD DESTOCK, fournisseur de parfums et cosmétiques qui vend à des professionnels (magasins, points de vente). Elone Maccioni (développeur freelance) pilote le projet et valide chaque lot avant le suivant.

- **App client iOS** (Expo / React Native) : catalogue, commande, compte. Publiée sur l'App Store.
- **Back-office administrateur** (Next.js, PWA) : commandes, produits et stocks, clients, encarts d'accueil, statistiques. Utilisé sur ordinateur et sur smartphone.

Les deux applications partagent la même base Supabase. **Pas de paiement en ligne** : une commande est une demande transmise au fournisseur, le règlement se fait hors application.

## Documents à lire avant de coder

1. `docs/SPEC.md` : périmètre fonctionnel, règles métier, écrans.
2. `docs/schema.sql` : modèle de données, fonctions et règles de sécurité (RLS). C'est la source de vérité de la base.
3. `docs/DESIGN.md` et `design/tokens.json` : design system.
4. `design/maquettes/` : maquettes HTML de tous les écrans (voir `design/maquettes/README.md`).
5. `docs/PLAN.md` : découpage en lots et critères de validation.

## Stack imposée

| Rôle                    | Choix                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Dépôt                   | Monorepo pnpm workspaces                                                           |
| App client              | Expo (SDK stable le plus récent), expo-router, TypeScript strict                   |
| Back-office             | Next.js (App Router), TypeScript strict, Tailwind CSS, PWA                         |
| Code partagé            | `packages/shared` : types générés Supabase, règles métier pures, tokens, formatage |
| Base, auth, fichiers    | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions), région UE            |
| Hébergement back-office | Vercel                                                                             |
| E-mails transactionnels | Resend                                                                             |
| Graphiques admin        | Recharts                                                                           |
| Police                  | Geist et Geist Mono (paquet `geist`) dans les deux apps                            |

Arborescence attendue :

```
apps/mobile      # Expo
apps/admin       # Next.js
packages/shared  # types, règles, tokens, formatage
supabase/        # migrations, seed.sql, functions/
design/          # tokens + maquettes (référence, ne pas modifier)
docs/            # spécification
```

N'ajoute pas de dépendance si la plateforme ou une dépendance déjà installée fait le travail. Pas d'ORM : client `supabase-js` typé avec les types générés (`supabase gen types`).

## Règles de travail

- **Un lot à la fois** (`docs/PLAN.md`). À la fin d'un lot : vérifie les critères de validation, résume ce qui est fait, ce qui ne l'est pas, et **arrête-toi** pour validation d'Elone.
- **Pixel perfect** : les maquettes font foi pour les tailles, espacements, couleurs, rayons et textes. Utilise les tokens, jamais de valeur en dur qui n'existe pas dans `design/tokens.json`. En cas d'écart entre une maquette et la spec, la spec gagne pour le comportement et la maquette gagne pour le visuel ; signale l'écart.
- **Écran non maquetté** (liste dans `docs/SPEC.md`, section 9) : construis-le avec les composants existants et le design system, sans nouveau style.
- **Règles métier côté base** : stock, numérotation et changement de statut passent par les fonctions SQL de `docs/schema.sql`, jamais par une écriture directe depuis le client.
- **Sécurité** : RLS activée sur toutes les tables. Le client mobile n'utilise que la clé `anon`. La clé `service_role` ne sort jamais des Edge Functions et des routes serveur Next.js.
- **Textes de l'interface en français**, montants en euros HT au format `1 126,40 €` (`Intl.NumberFormat('fr-FR')`), dates en français.
- **Accessibilité** : zones tactiles de 44 px minimum, libellés sur les boutons icônes, contrastes conformes (voir `docs/DESIGN.md`).
- **Tests** : chaque fonction SQL métier et chaque règle de `packages/shared` a un test. Pas de test d'interface exhaustif.
- **Secrets** : uniquement dans `.env.local` (non versionné). Maintiens un `.env.example` à jour.
- Garde ce fichier à jour si une décision change en cours de route.

## Photos produits (en attente du client)

Les vraies photos ne sont pas encore disponibles. Tant qu'un produit n'a pas de photo, affiche le **visuel de remplacement des maquettes** (flacon dessiné au trait sur fond Pierre `#F4F4F3`). Tout passe par un composant unique par app, `ProductImage`, qui choisit entre la photo et le visuel de remplacement. Le jour où les photos arrivent, il suffit de remplir `product_images` (upload depuis le back-office ou import) : **aucun écran ne doit changer**. Détails : `docs/SPEC.md`, section 6.

## Commandes utiles (à créer au lot 0)

```
pnpm dev:mobile      # Expo
pnpm dev:admin       # Next.js
pnpm db:reset        # supabase db reset (migrations + seed)
pnpm db:types        # régénère packages/shared/src/database.types.ts
pnpm test            # tests SQL + packages/shared
pnpm lint && pnpm typecheck
```

## Décisions en cours de route

- **Icônes : Lucide** (`lucide-react` côté admin, `lucide-react-native` côté mobile), au lieu des tracés SVG des maquettes (décision d'Elone, lot 0). Trait 1,6 (1,8 si actif), taille 24 (20 en admin). Seuls les trois flacons de `ProductImage` restent les tracés des maquettes.
- **`docs/schema.sql` → `supabase/migrations/`** : la migration reprend le schéma avec deux corrections : `drop table if exists _lines` dans `place_order` (plusieurs appels dans une transaction) et `revoke … from public, anon` + `grant … to authenticated, service_role` (Supabase accorde `execute` à PUBLIC par défaut). Les tests de `docs/schema.test.sql` sont repris en pgTAP dans `supabase/tests/`. `docs/` reste la référence ; toute évolution du schéma passe par une nouvelle migration.
- **EAN du seed** : ceux des maquettes ont une clé de contrôle invalide (SPEC §2 impose de la vérifier), le dernier chiffre a été corrigé dans `seed.sql`.
- **CLI Supabase** : installée en devDependency (`pnpm exec supabase …`), pas globalement. Docker requis.
- Les tokens sont copiés dans `packages/shared/src/tokens.json` (copie de `design/tokens.json`, à resynchroniser si le design change) ; le thème Tailwind de l'admin (`app/globals.css`) en est le miroir.
- **Lot 1, e-mails** : les triggers SQL appellent l'Edge Function `notify` via `pg_net` (URL et secret dans la table `app_settings`, jamais en dur ; `seed.sql` les renseigne en local, à insérer à la main en production). `notify` n'est pas protégée par JWT mais par l'en-tête `x-webhook-secret`. Elle envoie l'e-mail client (activé / refusé) et l'e-mail admin d'inscription ; la commande (lot 3) s'ajoutera au même endroit. `EMAIL_DRY_RUN=1` journalise au lieu d'envoyer.
- **Lot 1, local** : `pnpm functions:serve` doit tourner pour `verify-siret` et `notify`. Secrets des fonctions dans `supabase/functions/.env` (non versionné), apps dans `apps/*/.env.local`. Le typecheck mobile a besoin des types de routes générés par `expo start` (`.expo/types`, non versionné). L'inscription suppose la confirmation d'e-mail désactivée dans Supabase Auth (`enable_confirmations = false`), y compris en production.
- **Lot 1, accès** : `refused` et `pending` affichent le même écran « Demande envoyée » (message neutre) ; un compte `admin` ne peut pas ouvrir l'app mobile, un client ne peut pas ouvrir le back-office. Un client connecté sans profil (envoi interrompu) reprend le formulaire (`inscription-a-terminer`).
- **Back-office** : Next 16 utilise `proxy.ts` (ex-`middleware`). Les entrées de menu des lots suivants sont visibles mais inactives.
- **Lot 2, recherche** : le catalogue passe par la fonction SQL `catalog_products` (accents, casse, marque, filtres ; `security invoker`, donc la RLS s'applique), paginée côté client avec `.range()`. PostgREST ne sait pas trier un résultat de fonction sur une colonne absente du `select` : `created_at` reste dans `PRODUCT_COLUMNS`.
- **Lot 2, suppression produit** : un trigger SQL refuse la suppression d'un produit présent dans une commande (`product_in_order`) ; l'admin propose alors de le masquer. Les photos se réordonnent via `reorder_product_images`.
- **Lot 2, hors plan** : le panier local (`lib/cart.tsx`, pastille de l'onglet) existe déjà pour que « Ajouter à la commande » fonctionne ; l'écran Commande reste au lot 3. Les onglets Accueil, Commande et Compte sont des écrans provisoires (lots 3, 4, 5). Le bouton « Importer un CSV » de la maquette n'est pas affiché (lot 8).
- **Lot 2, tokens** : `color.onInkMuted` (#BDBDBD, texte secondaire sur fond encre, maquette Produit) a été ajouté à la copie des tokens de `packages/shared` : à reporter dans `design/tokens.json`.
- **Expo web** : le serveur lancé avec `CI=1` ne recharge pas les fichiers modifiés ; le relancer après chaque changement.
- **Lot 3, e-mails** : l'e-mail admin de commande part du même trigger que les inscriptions (`admin_notifications` → `notify_edge`). `notify` journalise l'envoi dans `order_events` (`admin_email_sent`), affiché dans l'historique de la commande. Le logo des e-mails reste le texte « EMD DESTOCK » tant que `EMAIL_LOGO_URL` n'est pas défini.
- **Lot 3, commande mobile** : le panier (lignes, message) est persisté par utilisateur ; le magasin choisi est le magasin actif. En cas de refus de stock (`insufficient_stock`, détail JSON `[{product_id, requested, available}]`), l'app ajuste les quantités et retourne au panier avec les lignes en erreur ; un produit masqué ou supprimé apparaît « indisponible » et bloque l'envoi jusqu'à son retrait. Le bouton « Ajouter un magasin » ouvre `magasin-form` (modification et archivage : lot 4).
- **Lot 3, écarts** : « Suivre ma commande » mène à l'onglet Compte, encore provisoire (historique et détail de commande : lot 4). Le fond des lignes « non consultées » de la liste admin utilise `surfaceAlt` (#FAFAFA) à la place de #FCFCFB de la maquette (hors tokens).
- **Test de concurrence** : deux clients commandant le dernier exemplaire en parallèle → une commande passe, l'autre reçoit `insufficient_stock` (vérifié avec un script `supabase-js`, non intégré à `pnpm test`).
- **Lot 4, suppression de compte** : l'Edge Function `delete-account` sert le client (son propre compte, corps ignoré) et l'admin (`{ company_id }`). Elle passe l'entreprise en `deleted`, efface le téléphone, supprime les utilisateurs Auth (profil en cascade, `orders.created_by` à null) ; les commandes restent. Le garde `guard_company_update` laisse passer le `service_role`. **Le SIRET d'une entreprise supprimée reste occupé** (contrainte unique) : une réinscription affiche « déjà inscrit » ; à décider avec le client.
- **Lot 4, accès en temps réel** : `companies` est publiée dans Supabase Realtime ; l'app mobile écoute son entreprise, donc une suspension/réactivation prend effet sans relancer l'app (la RLS coupe l'accès aux données dans tous les cas).
- **Lot 4, magasins** : `remove_store` supprime un magasin sans commande, sinon l'archive ; le dernier magasin actif ne peut pas être retiré. « Clients actifs » = statuts `active` et `suspended` ; commandes, total et dernière commande excluent les annulées (fonction `admin_clients`, mêmes règles sur la fiche).
- **Lot 4, périmètre** : l'e-mail de connexion et le SIRET ne sont pas modifiables (ni côté client ni côté admin). Un téléphone unique met à jour `companies.phone` et `profiles.phone`.
