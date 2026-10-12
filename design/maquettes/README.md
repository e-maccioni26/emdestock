# Maquettes

Exports des maquettes validées. **Référence visuelle : ne pas modifier, ne pas réutiliser ce code tel quel.**

## Comment les lire
- Les styles sont en ligne (`style="…"`) : ce sont les valeurs exactes à reproduire (tailles, espacements, couleurs, rayons).
- Les fichiers utilisent la syntaxe d'un outil de maquettage : `<x-dc>`, `<helmet>`, `{{ valeur }}`, `<sc-for>` (boucle), `<sc-if>` (condition) et une classe `Component` en bas de fichier qui fournit les données d'exemple et les interactions. Lis-les comme du pseudo-JSX : la classe montre les données et les états, le balisage montre le rendu.
- Ouvertes directement dans un navigateur, les parties dynamiques (`{{ }}`, boucles) ne s'affichent pas : seules les parties statiques sont visibles.
- Les textes de démonstration (produits, clients, montants) servent aussi de base au seed (SPEC §4).

## App client iOS (390 × 844)
| Fichier | Écran |
|---|---|
| `DesignSystem.html` | Planche du design system (couleurs, typo, composants) |
| `Connexion.html` | Connexion |
| `Inscription.html` | Demande d'accès professionnel (état après vérification SIRET réussie) |
| `EnAttente.html` | Demande envoyée, compte en attente |
| `Accueil.html` | Accueil d'un client ayant déjà commandé |
| `AccueilNouveau.html` | Accueil d'un client sans commande, avec carrousel d'encarts |
| `Catalogue.html` | Catalogue, recherche, filtres rapides |
| `Produit.html` | Fiche produit |
| `Commande.html` | Panier / commande (écran défilé en entier) |
| `Recap.html` | Récapitulatif avant envoi |
| `Confirmation.html` | Commande envoyée (remplacer la phrase sur les notifications, cf. SPEC §2) |
| `Compte.html` | Compte client (écran défilé en entier) |

## Back-office (1440 px de large)
| Fichier | Écran |
|---|---|
| `AdminDashboard.html` | Tableau de bord et statistiques, panneau de notifications (prop `notificationsOuvertes`) |
| `AdminCommandes.html` | Liste des commandes |
| `AdminCommandeDetail.html` | Détail d'une commande |
| `AdminEmail.html` | E-mail de notification envoyé à l'admin (640 px) |
| `AdminProduits.html` | Produits et stocks |
| `AdminProduitEdit.html` | Fiche produit en édition |
| `AdminClients.html` | Demandes d'inscription et clients actifs |
| `AdminClientFiche.html` | Fiche client |
| `AdminEncarts.html` | Gestion des encarts d'accueil |
| `AdminMobile.html` | Back-office sur smartphone (sous 768 px) |
