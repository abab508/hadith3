# Relecture finale — exigence 02, critères d'acceptation (§12)

Relecture du 2026-11-04 (livraison), sur la branche `claude/taches-techniques`.
Preuves vérifiées en lançant `npm test` (134 tests unitaires), `npm run controle` (9) et `npm run test:navigateur` (65).
« Conforme » signifie : le comportement existe **et** un test automatisé le vérifie. Les limites sont dites telles quelles.

| N° | Critère | Verdict | Preuve (où c'est vérifié) | Limite connue |
|---|---|---|---|---|
| 1 | L'arabe est disponible et défini comme langue initiale | Conforme | `langues.spec.ts` « / redirige vers l'arabe, en RTL » ; `preferences.spec.ts` « la racine ouvre l'arabe sans préférence, sans détection de la langue du navigateur » ; `catalogue.test.ts` « est valide et a l'arabe par défaut » | — |
| 2 | L'utilisateur peut changer de langue à tout moment | Conforme | `langues.spec.ts` « passage ar → fr → ur depuis le sélecteur » et « le sélecteur conserve le chemin et tous les paramètres de recherche » ; pastille des langues présente dans l'en-tête de chaque page | — |
| 3 | Anglais, français, espagnol, ourdou, indonésien, malais et turc prévus au lancement | Conforme | `data/langues/catalogue.json` (8 langues routables) ; `messages.test.ts` « existent pour chaque langue routable » et « ont les mêmes clés que ar.json » ; `catalogue.test.ts` « déclare honnêtement les langues de lancement expérimentales » | Textes es, ur, id, ms, tr (et fr, en) écrits par IA, **non relus** (`_meta.relu: false`) : relecture humaine à organiser par le patron |
| 4 | Ajouter d'autres langues sans refonte | Conforme | Procédure `docs/ajouter-une-langue.md` ; aucune liste de langues dans le code (catalogue + `messages/<tag>.json`) ; `completude.test.ts` (taux par langue) ; repli `[tag, …, ar]` testé | La recherche et les filtres de la page « Langues » (région, écriture) sont confiés à Codex (tâche en cours) |
| 5 | Interface RTL/LTR correcte | Conforme | `accessibilite.spec.ts` (lang et dir sur chaque page, pour chaque langue) ; `langues.spec.ts` « interface X : direction et sélecteur » ; `traductions.spec.ts` « textes mixtes en arabe » ; `texte-mixte.test.ts` (URL isolées en LTR dans un texte arabe, ponctuation arabe hors du lien) | Aucune URL n'apparaît encore dans les données : le composant `TexteMixte` est prêt et testé, sans cas réel à l'écran |
| 6 | Textes originaux et traductions séparés | Conforme | `traductions.spec.ts` « l'original arabe est séparé de la traduction automatique » ; schéma `hadith` (texteAr ≠ traductions[]) | — |
| 7 | Langue de l'interface indépendante de celle du rapport et de la recherche | Conforme | `preferences.spec.ts` « enregistre trois préférences indépendantes… » et « rapport et recherche conservent leurs propres valeurs après un changement d'interface » ; `preferences.test.ts` | Pas encore de comptes : la mémorisation n'existe que pour le visiteur (stockage local) |
| 8 | Les termes techniques conservent leur équivalent arabe | Conforme | `langues.spec.ts` « le terme suit le format « Terme (arabe — translittération) » » ; `termes.test.ts` « est valide et garde l'arabe original » ; `controle-terminologique.test.ts` | Définitions « à valider par un spécialiste » |
| 9 | Les traductions IA sont identifiées comme telles | Conforme | `traductions.spec.ts` (mention « traduction automatique ») ; `provenance.test.ts` (5 statuts distincts, IA ≠ IA relue, validée ≠ publiée) ; `messages.test.ts` « identifient les traductions IA comme non relues » | — |
| 10 | Références accessibles quelle que soit la langue | Conforme | `parcours.spec.ts` « rapport ar : page en RTL… » (tableau des sources présent) ; références des recueils affichées en translittération + arabe dans toutes les langues | Pages et tomes de plusieurs références « à compléter » (données) |
| 11 | Traductions manquantes signalées honnêtement | Conforme | `traductions.spec.ts` « rapport es : … statut « original non traduit » » ; `messages.test.ts` « complètent une traduction manquante par la langue suivante » ; bandeau de repli `commun.repliSignale` | — |
| 12 | Tests automatisés des fonctions multilingues | Conforme | 134 tests unitaires, 9 contrôles, 65 tests navigateur (voir ci-dessus) | Pas d'exécution automatique de ces tests sur GitHub pour hadith3 (seuls Vercel et Codex relisent les PR) |

## Bilan

Les 12 critères sont **remplis et testés**. Ce qui reste n'est pas du code, mais du travail humain ou des données :
- relecture humaine des traductions d'interface (7 langues) ;
- validation des termes et définitions par un spécialiste ;
- références complètes (tomes, pages) et corpus de hadiths plus large, depuis des sources vérifiées.

À envisager : lancer `npm test` et `npm run test:navigateur` automatiquement sur chaque PR (GitHub Actions), comme le fait déjà le dépôt `milaghaiba-cinematic`.
