# Spécification fonctionnelle : EMD DESTOCK

Version 1.0, 12 octobre 2026. Référence : devis Avy, maquettes validées dans `design/maquettes/`.

## 1. Acteurs

| Acteur | Accès | Création du compte |
|---|---|---|
| Client professionnel | App iOS | Inscription dans l'app, puis validation par l'admin |
| Administrateur | Back-office PWA | Créé à la main (seed ou dashboard Supabase), rôle `admin` |

Un client appartient à une **entreprise** (`companies`), identifiée par son SIRET. Une entreprise a un ou plusieurs **magasins** (`stores`). Une commande est toujours passée pour un magasin.

## 2. Règles métier

### Inscription et accès
- Le client saisit son SIRET (14 chiffres). L'app appelle l'Edge Function `verify-siret` (API Sirene de l'Insee). Si l'établissement existe et est actif, raison sociale, adresse, code postal et ville sont préremplis et restent modifiables. Sinon : message d'erreur, envoi bloqué.
- Un SIRET ne peut être inscrit qu'une fois (contrainte unique). Message : « Ce SIRET est déjà inscrit. Contactez EMD DESTOCK. »
- À l'envoi : création du compte Supabase Auth, du profil, de l'entreprise (statut `pending`) et d'un premier magasin reprenant l'adresse saisie. Notification admin (in-app + e-mail).
- Tant que l'entreprise n'est pas `active`, le client connecté ne voit que l'écran « Demande envoyée » (`EnAttente`). La RLS lui interdit catalogue et commandes.
- L'admin valide ou refuse. Validation : statut `active`, e-mail « Votre compte est activé » au client. Refus : statut `refused`, e-mail neutre. L'admin peut ensuite suspendre un client (`suspended`) : mêmes effets qu'un compte en attente, avec le texte « Accès suspendu ».
- Mot de passe : 12 caractères minimum dont un chiffre.

### Catalogue
- Le client ne voit que les produits `is_visible = true`. La visibilité est **globale** (pas de visibilité par client en V1).
- Stock affiché : `≥ 10` → « N en stock » (vert) ; `1 à 9` → « Plus que N » (ambre) ; `0` → « Rupture » (badge noir, carte voilée, ajout impossible). Seuil 10 défini dans `packages/shared`.
- Recherche sur titre, marque, référence et EAN (insensible à la casse et aux accents). Filtres : catégorie, marque, disponibilité (« Disponibles » = stock > 0).
- Pagination par défilement infini, 30 produits par page, tri par défaut : nouveautés d'abord (`created_at` décroissant).

### Commande
- Le panier vit sur l'appareil (AsyncStorage, par utilisateur). La pastille rouge de l'onglet Commande affiche le **nombre de références**.
- Quantité minimale 1 ; le sélecteur est plafonné au stock connu.
- **Magasin obligatoire** : bouton « Vérifier la commande » désactivé tant qu'aucun magasin n'est choisi. Le magasin actif (sélecteur en en-tête du catalogue et de l'accueil) est présélectionné.
- Message libre facultatif, 1 000 caractères maximum.
- Envoi via la fonction SQL `place_order` (atomique) :
  - vérifie que l'entreprise est active, que le magasin lui appartient, que chaque produit est visible ;
  - verrouille les lignes produit, vérifie le stock, **décrémente le stock** ;
  - fige référence, titre, EAN et prix unitaire dans `order_items` ;
  - numérote la commande `CMD-AAAA-NNNN` (séquence remise à zéro chaque année) ;
  - crée l'événement d'historique et la notification admin.
  - Si un stock est insuffisant : aucune écriture, erreur listant les produits concernés et le stock restant. L'app met à jour le panier et affiche ces lignes en erreur.
- Statuts : `received` (Reçue), `preparing` (En préparation), `done` (Traitée), `cancelled` (Annulée). Seul l'admin change le statut, via `set_order_status`.
- **Annulation** : restitue le stock de chaque ligne. Une commande annulée ne peut plus changer de statut.
- Le client voit le statut dans son historique (lecture à l'ouverture de l'écran, rafraîchissement au retour sur l'app). **Pas de notification push ni d'e-mail au client sur les changements de statut en V1.** Sur l'écran Confirmation, remplace la phrase de la maquette par : « Suivez son statut depuis votre compte. »
- Montants : HT uniquement, « Total estimé ». Aucun calcul de TVA ni de frais de port.

### Compte client
- Modification des informations entreprise et contact (le SIRET n'est pas modifiable).
- Magasins : ajout, modification. Suppression seulement si aucune commande n'y est rattachée ; sinon le magasin est archivé (`archived_at`) et disparaît des sélecteurs.
- **Suppression du compte** (exigence Apple) : confirmation explicite, puis Edge Function `delete-account` : supprime l'utilisateur Auth et le profil, passe l'entreprise en `deleted` et efface ses données personnelles (contact, téléphone, e-mail). Les commandes restent pour la comptabilité du fournisseur, rattachées à la raison sociale et au SIRET.

### Encarts d'accueil (carrousel)
- Gérés dans le back-office : surtitre (40 car.), titre (60 car.), texte du bouton (24 car.), fond (`encre`, `pierre`, `blanc`) ou image, destination (produit, catégorie, marque ou sélection de produits), audience, dates de début et de fin, ordre.
- Audience `new` : clients sans aucune commande. Audience `all` : tous les clients.
- Un encart s'affiche si `starts_at ≤ maintenant < ends_at`. Statut calculé : Programmé, Actif, Terminé.
- Accueil d'un client **sans commande** : carrousel des encarts `new` et `all` à la place de la carte « Dernière commande » (maquette `AccueilNouveau`).
- Accueil d'un client **ayant commandé** : carte « Dernière commande » en tête (maquette `Accueil`), puis le carrousel des encarts `all` s'il y en a.
- Défilement automatique toutes les 4,5 s, interrompu au toucher ; pagination par points ; l'encart suivant dépasse à droite. 5 encarts actifs maximum (contrôlé dans le back-office).
- Destination « sélection » : écran catalogue filtré sur la liste de produits de l'encart, titre de l'encart en en-tête.

### Back-office
- **Tableau de bord** : période semaine / mois / année. Indicateurs : commandes reçues, unités commandées, montant estimé HT, clients actifs (au moins une commande sur la période), chacun avec l'évolution vs la période précédente. Graphique en barres des commandes (par jour, semaine ou mois), produits les plus commandés (top 5 en unités), activité par magasin (top 5), dernières commandes. Les commandes annulées sont exclues des statistiques. Calculs dans la fonction SQL `admin_stats`.
- **Notifications in-app** : cloche avec point rouge s'il y a des non-lues ; panneau listant nouvelles commandes et demandes d'inscription ; « Tout marquer comme lu ». Mise à jour en direct (Supabase Realtime sur `admin_notifications`).
- **E-mail admin** à chaque nouvelle commande (maquette `AdminEmail`) et à chaque demande d'inscription. Adresse de destination : variable d'environnement `ADMIN_NOTIFICATION_EMAIL`.
- **Commandes** : onglets par statut avec compteurs, recherche (numéro, client, magasin), filtres client, magasin, période ; pagination 10 lignes ; point rouge sur les commandes non consultées (`viewed_at` nul). Détail : lignes avec stock restant, message client, changement de statut, infos client et magasin, historique, annulation avec remise en stock, impression du bon (`window.print()` avec une feuille de style d'impression, sans génération de PDF).
- **Produits & stocks** : onglets Tous, Visibles, Masqués, Stock faible, Rupture ; recherche titre / référence / EAN ; filtres marque, catégorie ; interrupteur de visibilité dans la liste ; création, modification, suppression (suppression interdite si le produit figure dans une commande : proposer de le masquer). Fiche : titre, marque, catégorie, référence, EAN (13 chiffres, clé de contrôle vérifiée), description courte, texte produit (1 000 car.), prix HT, poids, stock, photos, aperçu app.
- **Clients** : onglet Demandes d'inscription (valider / refuser) et onglet Clients actifs (liste, recherche). Fiche client : indicateurs, historique des commandes, entreprise, magasins associés, suspension, suppression. Case « Ancien client » : stockée (`is_former_client`) mais **sans effet en V1** (préparation des tarifs préférentiels V2), badge « V2 » comme sur la maquette.
- **Marques et catégories** : gérées depuis des listes simples dans la fiche produit (sélecteur avec « + Créer »). Pas d'écran dédié en V1.
- **Version smartphone** : le back-office est responsive. Sous 768 px : barre d'onglets en bas (Tableau, Commandes, Produits, Clients, Plus) comme la maquette `AdminMobile`, listes en cartes au lieu de tableaux. « Plus » ouvre Encarts et Déconnexion.
- **PWA** : manifest (nom « EMD Admin », icône issue du logo, couleur `#0A0A0A`), installable, service worker limité au cache des ressources statiques (pas de mode hors ligne des données).

## 3. Hors périmètre V1
Paiement en ligne, tarifs préférentiels et visibilité par client, notifications push, e-mails au client sur les statuts, application Android, multi-administrateurs avec rôles, export comptable, import CSV (lot ultérieur, format en attente du client).

## 4. Données de démonstration (seed)
Reprendre les données des maquettes : marques Maison Lior, Atelier Sorel, Botanica Paris ; produits des maquettes (Ambre Nocturne, Vétiver Gris, Crème Mains Iris, Musc Blanc, etc.) avec leurs références, EAN, prix et stocks ; client Parfumerie Wilson SAS (Camille Martin, deux magasins) ; quelques commandes dans chaque statut ; trois demandes d'inscription ; quatre encarts. Un compte admin et un compte client de démo (identifiants dans `.env.example`, utiles aussi pour la revue Apple).

## 5. Intégrations

| Service | Usage | Variables |
|---|---|---|
| API Sirene (Insee) | Vérification SIRET, dans `verify-siret` | `INSEE_API_KEY` |
| Resend | E-mails admin et client | `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` |
| Supabase | Base, auth, stockage, temps réel | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement) |

Les e-mails partent d'un domaine encore à configurer : rends l'expéditeur paramétrable et n'écris aucune adresse en dur. Gabarits e-mail en HTML simple, style de la maquette `AdminEmail`.

## 6. Photos produits et visuel de remplacement

Les photos ne sont pas encore fournies. Mécanisme à mettre en place dès maintenant :

- Table `product_images` (chemin dans le bucket Storage `product-images`, position). La photo de position 0 est la vignette.
- `packages/shared/src/product-image.ts` : `getProductImageUrl(product, size)` renvoie l'URL publique de la première photo, ou `null`.
- Un composant **`ProductImage`** par app (`apps/mobile/components/ProductImage.tsx`, `apps/admin/components/ProductImage.tsx`), seul endroit qui affiche une image produit (catalogue, fiche, accueil, commande, récapitulatif, back-office, aperçu encart) :
  - URL présente → la photo (`expo-image` côté mobile, `next/image` côté admin), `object-fit: contain` sur fond Pierre.
  - Sinon → le **visuel de remplacement des maquettes** : flacon dessiné au trait, centré sur fond `#F4F4F3`, trait `#0A0A0A`. Trois formes reprises des SVG des maquettes (`tall`, `round`, `tube`) ; la forme vient de `products.placeholder_shape` (valeur par défaut `tall`).
- Back-office : la fiche produit permet déjà d'ajouter, réordonner et supprimer des photos (JPG ou PNG, carré conseillé 1 500 px, 5 Mo max). À l'upload, une route serveur Next.js génère une vignette 400 px (`sharp`) stockée à côté de l'original.
- Quand les photos arriveront, il suffira de les charger (back-office ou futur import) : aucun écran ne change, et `placeholder_shape` ne sert plus que pour les produits sans photo.

## 7. Écrans maquettés

Voir `design/maquettes/README.md` pour la correspondance fichier ↔ écran.

## 8. États à prévoir partout
Chargement (squelettes aux dimensions des cartes, pas de spinner plein écran), liste vide (texte court et action utile), erreur réseau (message + bouton « Réessayer »), produit en rupture, formulaire invalide (bordure `#B42318` + message sous le champ, cf. design system).

## 9. Écrans non maquettés (à construire avec le design system)

App client :
- Mot de passe oublié et nouveau mot de passe (lien e-mail Supabase, deep link).
- Détail d'une commande (depuis Compte et la carte Dernière commande) : statut, magasin, lignes, total, message.
- Historique complet des commandes (« Tout voir »).
- Ajouter / modifier un magasin (feuille modale).
- Sélecteur du magasin actif (feuille modale listant les magasins).
- Filtres du catalogue (feuille modale : catégories, marques, disponibilité, bouton « Afficher N produits »).
- Modifier les informations entreprise et contact.
- Confirmation de suppression du compte (alerte native iOS).
- Écran « Accès suspendu » (variante de `EnAttente`).

Back-office :
- Connexion (même composition que l'écran Connexion mobile, centré, carte de 400 px).
- Création d'un produit (même écran que l'édition, vide).
- Création d'un encart (même écran que l'édition).
- Versions mobiles des pages (cartes au lieu de tableaux).
