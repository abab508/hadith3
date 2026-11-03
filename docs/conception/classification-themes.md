# Classification thématique — Milaghaiba

## Objectif
Navigation par **16 grands chapitres**, **114 sous-thèmes**, comprenant notamment mariage, divorce, famille, croyance, purification, prière, jeûne, commerce, santé, justice, spiritualité et fin des temps.

## Fondements documentaires
La taxonomie est une **organisation éditoriale de navigation** inspirée de la subdivision en livres des grandes collections, notamment :
- https://sunnah.com/bukhari
- https://sunnah.com/muslim

Les livres de chaque recueil ne correspondent pas toujours aux mêmes subdivisions ; une rubrique ne doit donc pas être attribuée automatiquement à l'ensemble des recueils.

## Contraintes
- Ne jamais inventer ni déduire un hadith, une chaîne ou un jugement d'authenticité à partir d'un simple titre.
- Les liens « Rechercher » transmettent un terme arabe à la recherche existante et ne garantissent pas de résultats pertinents ou exhaustifs.
- Toute future association hadith–thème doit être sourcée, révisable, et distinguer classification automatique vs humaine.
- Les textes arabes originaux sont intacts.
- Les traductions du catalogue sont en FR/AR/EN ; les autres interfaces utilisent provisoirement le français comme langue de repli.
- Les styles sont isolés dans `Themes.module.css`, avec prise en compte de la réduction de mouvement.
- Les nouvelles dépendances npm sont évitées ; les polices décoratives étaient déjà déclarées dans le projet.

## Sécurité du déploiement
Le Render `mina-gaiba-2` pointe vers `abab508/hadith3`, branche `mina-gaiba-2`, avec déploiement automatique sur commit.
Cette branche de fonctionnalité doit d'abord passer les contrôles et être revue. Ne pas fusionner ni redéployer automatiquement.
