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
