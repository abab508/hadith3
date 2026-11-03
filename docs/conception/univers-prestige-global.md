# Identité graphique unifiée — Milaghaiba Prestige

## Pages couvertes
- Accueil et grands chapitres / sous-thèmes
- Recherche, filtres, résultats locaux / indexés / distants
- Rapports documentaires, chaînes de transmission, fiches de transmetteurs
- Fiches sources et rapports externes
- Sources, glossaire, langues, paramètres, mémorisation et administration d'import

## Design
- Palette nuit émeraude, or et ivoire avec thème clair conservé
- En-tête, navigation et boutons unifiés ; liens Thèmes et Sources ajoutés au menu
- Bandeau identitaire partagé sur les pages de consultation
- Illustration locale `public/illustrations/prestige-panorama.svg` : architecture abstraite et paysage nocturne
- Illustration locale `public/illustrations/justice-balance.svg` : balance sans statue
- Typographies de titre déjà prévues par le projet : Berkshire Swash, Cormorant Garamond, Aref Ruqaa Ink
- Texte arabe original toujours en Noto Naskh Arabic pour la lisibilité

## Garde-fous
- Aucune modification des JSON religieux ni des notices de provenance
- Aucun changement des verdicts des transmetteurs ; ne pas uniformiser les classes sémantiques source, compagnon, fiable, faible, non-évalué
- Menu de langues et chemins existants préservés
- Réduction de mouvement, navigation clavier, styles d'impression et mise en page mobile
- SVG source interne : aucune image d'utilisateur n'est envoyée à un fournisseur d'images
- Certaines cartes thématiques conservent à ce stade des photographies externes : le projet n'est pas une reproduction pixel par pixel des maquettes générées

## Validation
Réaliser `npm test`, `npm run typecheck`, `npm run build` et les tests Playwright. La compilation et la livraison Render ne doivent pas être déclarées réussies avant les statuts effectifs.
