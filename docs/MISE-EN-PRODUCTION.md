# Mise en production

Ce guide liste, dans l'ordre, ce qu'il faut faire avec les comptes d'Elone (Supabase, Vercel, Resend, Apple, Expo). Rien ici n'est exécuté automatiquement. Tous les secrets restent dans les variables d'environnement des services, jamais dans le dépôt.

## 1. Supabase (région UE)

1. Créer un projet Supabase en région UE (Paris ou Francfort). Noter l'URL, la clé `anon` et la clé `service_role`.
2. Lier et pousser le schéma :
   ```bash
   pnpm exec supabase link --project-ref <ref>
   pnpm exec supabase db push        # migrations uniquement, jamais le seed
   ```
3. Auth › Providers › Email : **désactiver « Confirm email »** (l'inscription suppose `enable_confirmations = false`). Auth › URL : renseigner l'URL du back-office.
4. Créer le compte administrateur : Auth › Users › Add user (e-mail + mot de passe fort), puis dans l'éditeur SQL :
   ```sql
   insert into profiles (id, role, first_name, last_name, email, can_manage_team)
   values ('<uuid du user>', 'admin', 'Prénom', 'Nom', '<e-mail>', true);
   ```
   Ce premier compte est « gestionnaire d'équipe » : il crée ensuite les comptes des employés depuis le back-office (menu Équipe).
5. Insérer les réglages d'envoi des e-mails (jamais en dur dans une migration) :
   ```sql
   insert into app_settings values
     ('notify_url', 'https://<ref>.supabase.co/functions/v1/notify'),
     ('notify_secret', '<secret aléatoire long>');
   ```
6. Déployer les Edge Functions et leurs secrets :
   ```bash
   pnpm exec supabase secrets set INSEE_API_KEY=… RESEND_API_KEY=… EMAIL_FROM=… \
     ADMIN_NOTIFICATION_EMAIL=… ADMIN_URL=https://<back-office> NOTIFY_WEBHOOK_SECRET=<même secret> EMAIL_DRY_RUN=0
   pnpm exec supabase functions deploy verify-siret notify delete-account admin-users
   ```
   `notify` n'est pas protégée par JWT (`verify_jwt = false` dans `supabase/config.toml`) mais par l'en-tête `x-webhook-secret`. `verify-siret`, `delete-account` et `admin-users` gardent la vérification JWT par défaut ; `delete-account` et `admin-users` contrôlent en plus l'appelant dans leur code (`admin-users` exige un administrateur gestionnaire d'équipe actif).
7. Storage : les buckets `product-images` et `banner-images` sont créés par les migrations.

## 2. Resend (e-mails)

Ajouter et vérifier le domaine d'envoi (DNS : SPF, DKIM), puis renseigner `EMAIL_FROM` avec une adresse de ce domaine. Tant que le domaine n'est pas vérifié, laisser `EMAIL_DRY_RUN=1` (les e-mails sont journalisés, pas envoyés). Définir aussi `EMAIL_LOGO_URL` (logo en PNG hébergé) pour remplacer le texte « EMD DESTOCK » des e-mails.

## 3. Back-office sur Vercel

1. Importer le dépôt, **Root Directory : `apps/admin`**, framework Next.js. Le monorepo pnpm est détecté ; `packages/shared` est transpilé (`transpilePackages`).
2. Variables d'environnement (Production) :
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Le back-office n'a pas besoin de la clé `service_role` (les routes d'upload utilisent la session de l'administrateur).
3. Déployer, puis renseigner l'URL publique dans `ADMIN_URL` (secrets Supabase, étape 1.6).
4. Installation : sur iPhone, Safari › Partager › « Sur l'écran d'accueil ». Sur ordinateur, Chrome ou Edge › « Installer EMD Admin ».

## 4. Application iOS (Expo EAS)

Prérequis : compte Apple Developer, compte Expo, `eas-cli` (`pnpm dlx eas-cli`).

1. `cd apps/mobile && eas login && eas init` (écrit l'identifiant de projet dans `app.json`).
2. Variables de production (EAS › Environment variables, visibilité « Sensitive » sauf URLs publiques) : `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (jamais la clé `service_role`), `EXPO_PUBLIC_CONTACT_EMAIL`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_PRIVACY_URL`.
3. `eas build --platform ios --profile production`, puis `eas submit --platform ios` (TestFlight).
4. App Store Connect : fiche de l'app, URL de la politique de confidentialité (obligatoire), captures, et **compte de démonstration** pour la revue (voir ci-dessous). Bundle ID : `fr.emddestock.app`.

### Compte de démonstration pour la revue Apple

Le seed est réservé au local. En production, créer à la main un client actif :

1. Auth › Add user : `demo-client@<domaine>` + mot de passe fort (à communiquer à Apple dans « Notes de revue »).
2. SQL (remplacer `<uuid du user>`, utiliser un SIRET de 14 chiffres valide pour l'unicité) :
   ```sql
   with c as (
     insert into companies (siret, legal_name, address, postal_code, city, phone, status, validated_at)
     values ('<siret>', 'Boutique Démo', '1 rue de la Démo', '75001', 'Paris', '0100000000', 'active', now())
     returning id
   ), p as (
     insert into profiles (id, role, company_id, first_name, last_name, email, phone)
     select '<uuid du user>', 'client', c.id, 'Compte', 'Démo', 'demo-client@<domaine>', '0100000000' from c
   )
   insert into stores (company_id, name, address, postal_code, city)
   select c.id, 'Boutique Démo', '1 rue de la Démo', '75001', 'Paris' from c;
   ```
3. Ajouter quelques produits visibles depuis le back-office pour que le catalogue ne soit pas vide.

## 5. Avant d'ouvrir aux clients

- [ ] Pages légales (conditions d'utilisation, politique de confidentialité) en ligne, URLs dans les variables EAS.
- [ ] Domaine Resend vérifié, `EMAIL_DRY_RUN=0`, un e-mail de test reçu (inscription, validation, commande).
- [ ] Un SIRET réel testé de bout en bout (inscription → validation admin → e-mail → connexion).
- [ ] Import du catalogue (lot 8, fichier CSV du client).
- [ ] `verify-siret` : vérifier que la limite d'appels voit bien l'IP réelle (appeler 11 fois de suite avec le même SIRET : le 11e doit répondre « Trop de vérifications »).
- [ ] Auth : `secure_password_change = true`, et second facteur (TOTP) pour les comptes administrateurs (non fait, voir l'audit).
- [ ] Sauvegardes Supabase activées (plan payant) et mot de passe administrateur unique.
