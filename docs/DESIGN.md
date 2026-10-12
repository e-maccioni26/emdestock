# Design system EMD DESTOCK

Valeurs exactes : `design/tokens.json`. Planche visuelle : `design/maquettes/DesignSystem.html`.

## Principes
- Le logo (lettrage EMD noir à ombre rouge) porte seul l'expression de la marque. L'interface reste neutre : encre, blanc, gris chauds.
- **Rouge de marque `#D9301F` : usage rare.** Uniquement la pastille du panier, le point des notifications non lues et le point des commandes non consultées. Jamais sur un bouton ni pour une erreur.
- Les erreurs utilisent `#B42318`, distinct du rouge de marque.
- Boutons principaux noirs, secondaires blancs bordés `#D4D4D4`, liens soulignés (décalage 3 px).
- La rupture de stock est un badge **noir**, pas rouge, pour ne pas la confondre avec une erreur.
- Chiffres (prix, quantités, compteurs) en `tabular-nums`. Références et EAN en Geist Mono.

## Grille et mesures
- Grille de 8 px, ajustements à 4 px. Marge latérale mobile 20 px. Zones tactiles ≥ 44 px.
- Mobile : maquettes à 390 × 844, safe area haute 56 px, basse 34 px, barre d'onglets 49 px + safe area.
- Back-office : barre latérale 248 px, en-tête 76 px, contenu à 32 px des bords. Sous 768 px, barre d'onglets en bas (maquette `AdminMobile`).
- Rayons : badge 6, contrôle admin 10, carte et champ mobile 12, bloc 16, pilule 999.

## Composants
| Composant | Mobile | Back-office |
|---|---|---|
| Bouton | 52 px (44 compact), rayon 12, 15 px semi-gras | 40 px (36 petit), rayon 10, 14 px semi-gras |
| Champ | 48 px, bordure `#E5E5E5`, focus bordure + anneau 1 px encre, erreur bordure `#B42318` + message 13 px | 40 px, rayon 10 |
| Badge de statut | pilule 24 px, point 6 px, 12 px semi-gras, couleurs de `orderStatus` | idem |
| Badge de stock | 22 px, rayon 6, 11 px semi-gras | idem |
| Carte produit | image 169 px fond Pierre rayon 12, surtitre marque, titre 2 lignes max, réf. mono, prix + stock | ligne de tableau avec vignette 40 px |
| Sélecteur de quantité | 44 px, bordure, boutons − / + de 44 px | – |
| Interrupteur | – | 40 × 24, fond encre actif, `#D4D4D4` inactif |
| Barre d'onglets | 4 onglets, icônes trait 24 px, actif en encre et semi-gras, sans couleur ajoutée | 5 onglets sous 768 px |

Icônes : dessin au trait (stroke 1,6, 1,8 si actif), reprendre les tracés SVG des maquettes. Pas d'émoji.

## Visuel produit de remplacement
Fond Pierre `#F4F4F3`, flacon au trait encre, centré. Trois formes (`tall`, `round`, `tube`), tracés SVG dans `Catalogue.html` et `Produit.html`. Produit en rupture : voile blanc à 55 % sur l'image.

## Accessibilité
Texte secondaire `#6B6B6B` sur blanc : contraste 5,3:1, à ne pas éclaircir. Boutons icônes avec `accessibilityLabel` / `aria-label`. Statuts jamais portés par la couleur seule (toujours un libellé).
