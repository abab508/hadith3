# Référence graphique de Milaghaiba : reproduction fonctionnelle

## Ce que demandait la maquette
En-tête unique horizontal : marque à gauche, Accueil / Thèmes / Recherche / Sources au centre, langue FR | AR | EN et options dans un menu. Grande scène nocturne avec bibliothèques, lanterne, Coran posé sur un lutrin/table, croissant et mosquée. Titre doré et recherche. Huit cartes visuelles en deux lignes de quatre, sélection du chapitre Mariage et famille à droite, six sous-thèmes, navigation en bas.

## Implantation dans le véritable site Render
- Le même composant `VueCatalogue` est maintenant affiché sur `/[locale]` et `/[locale]/themes`.
- L'ancien moteur de recherche et les autres sections de l'accueil sont conservés sous la scène.
- Les huit cartes majeures sont présentées en premier, avec un bouton affichant les huit autres chapitres. Le catalogue contient toujours les seize grands chapitres et les 114 sous-thèmes.
- Nouvelle barre de navigation `EnTete` + `SelecteurLangue`; les autres langues et outils sont accessibles via « Plus ».
- Le bandeau se base sur `public/illustrations/maquette-hero-ornement.svg`, créé pour le site.
- L'illustration Justice conserve une balance sans statue.
- Les données et textes arabes des hadiths ne sont pas modifiés.

## Limites avant de déclarer un rendu « identique »
Le visuel généré transmis en référence est une image illustrative, pas une maquette Figma avec éléments séparés. L'illustration SVG reconstitue sa composition mais n'est **pas** une reproduction photographique pixel à pixel. Pour une égalité visuelle stricte, il faut également intégrer les décors raster originaux découpés de la maquette ou générer des assets 3D spécifiques, puis comparer de vraies captures desktop/mobile sur Render. Les photographies des cartes restent pour partie hébergées à l'extérieur.
Le design reste soumis à l'accessibilité, au responsive, à la recherche réelle et à la lisibilité des hadiths.

## Validation
Tests CI existants : npm test, npm run typecheck, npm run build.
Tests Playwright ajoutés pour la navigation et la structure visuelle, mais ils ne tournent pas automatiquement dans le workflow CI actuel. Aucun résultat Playwright ne doit être supposé avant exécution.
