# Plan de développement par lots

Règle : un lot à la fois. À la fin de chaque lot, vérifie les critères, fais un résumé (fait / non fait / écarts aux maquettes) et **attends la validation d'Elone** avant le lot suivant.

## Lot 0 : Socle
- Monorepo pnpm (`apps/mobile`, `apps/admin`, `packages/shared`, `supabase/`), TypeScript strict, ESLint, Prettier.
- Supabase local (`supabase init`), migrations tirées de `docs/schema.sql`, `seed.sql` avec les données des maquettes (SPEC §4), tests SQL repris de `docs/schema.test.sql` (pgTAP).
- `packages/shared` : types générés, tokens (`design/tokens.json`), formatage euros / dates / numéros, règles de stock (seuils, libellés).
- Polices Geist chargées dans les deux apps ; composants de base (Bouton, Champ, Badge de statut, Badge de stock, `ProductImage` avec visuel de remplacement).
- `.env.example`, scripts `pnpm` listés dans `CLAUDE.md`.

**Validé quand** : `pnpm db:reset && pnpm test && pnpm lint && pnpm typecheck` passent ; les deux apps démarrent et affichent un écran de démonstration des composants de base conforme à la planche design system.

## Lot 1 : Comptes et inscription
- Mobile : Connexion, Inscription (avec `verify-siret`), Demande envoyée, Accès suspendu, Mot de passe oublié, déconnexion. Redirection selon le statut de l'entreprise.
- Edge Function `verify-siret` (API Sirene).
- Admin : Connexion admin, Clients › Demandes d'inscription (valider / refuser), e-mails client (Resend).
- Garde d'accès : un client ne peut pas ouvrir le back-office.

**Validé quand** : un nouveau client s'inscrit avec un vrai SIRET, voit l'écran d'attente, l'admin valide, le client reçoit l'e-mail et accède à l'app. SIRET invalide et SIRET déjà inscrit affichent le bon message.

## Lot 2 : Catalogue et produits
- Mobile : Catalogue (recherche, filtres, défilement infini, sélecteur de magasin), Fiche produit (galerie, quantité).
- Admin : Produits & stocks (onglets, recherche, filtres, interrupteur de visibilité), création / édition / suppression, marques et catégories, upload de photos avec vignette.
- `ProductImage` branché partout (SPEC §6).

**Validé quand** : un produit masqué disparaît de l'app ; un produit sans photo affiche le flacon ; après upload d'une photo dans l'admin, elle apparaît dans l'app sans autre modification ; les badges de stock suivent les seuils.

## Lot 3 : Commande
- Mobile : panier persistant, Commande (magasin obligatoire, quantités, message), Récapitulatif, Confirmation, gestion de l'erreur de stock.
- Admin : Commandes (onglets, recherche, filtres, pagination), Détail (changement de statut, annulation avec remise en stock, impression), point « non consultée ».
- Edge Function `notify` : e-mail admin à chaque commande (maquette `AdminEmail`) et à chaque inscription.

**Validé quand** : deux clients qui commandent le dernier exemplaire en même temps → une seule commande passe, l'autre voit l'erreur de stock ; l'annulation restitue le stock ; l'e-mail admin arrive avec les bonnes lignes.

## Lot 4 : Compte client et fiches clients
- Mobile : Compte (infos, magasins avec ajout / modification / archivage, historique, détail de commande, suppression du compte via `delete-account`).
- Admin : Clients actifs, Fiche client (indicateurs, historique, magasins, suspension, suppression, case « Ancien client » sans effet).

**Validé quand** : la suppression de compte respecte SPEC §2 (commandes conservées, données personnelles effacées) ; un client suspendu perd l'accès immédiatement.

## Lot 5 : Accueil et encarts
- Mobile : Accueil (deux variantes selon l'historique), carrousel avec défilement automatique, destinations des encarts.
- Admin : Encarts d'accueil (liste ordonnable, édition, aperçu en direct, statuts Programmé / Actif / Terminé, limite de 5 actifs).

**Validé quand** : un client sans commande voit les encarts `new` et `all`, un client ayant commandé voit la carte Dernière commande puis les encarts `all` ; un encart programmé apparaît à sa date de début.

## Lot 6 : Tableau de bord et notifications
- Admin : Tableau de bord via `admin_stats` (semaine / mois / année, comparaison), notifications in-app en temps réel (cloche, panneau, tout marquer comme lu).

**Validé quand** : les chiffres du tableau de bord correspondent à un calcul manuel sur le seed ; une nouvelle commande allume la cloche sans recharger la page.

## Lot 7 : PWA, finitions et publication
- Admin : version responsive sous 768 px (maquette `AdminMobile`), manifest et installation PWA, déploiement Vercel.
- Mobile : icône et écran de lancement, build EAS, compte de démonstration pour la revue Apple, envoi sur TestFlight.
- Revue pixel perfect écran par écran contre les maquettes, états vides / chargement / erreur partout.

**Validé quand** : back-office installable sur iPhone et ordinateur ; build TestFlight fonctionnel ; aucun écart visuel non justifié.

## Lot 8 (ultérieur) : Import CSV
Format en attente du fichier d'exemple du client. Ne pas démarrer sans ce fichier.
