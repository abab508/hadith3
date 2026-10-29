# Tâches pour l'autopilote
Légende : [ ] à faire · [x] faite · [!] attend le patron (avec la raison)
Ajouter [strategie] au début d'une tâche business.

Source des exigences : docs/exigences/01 (terminologie), 02 (multilingue), 03 (couverture mondiale).
Règles pour toutes les tâches : aucune définition savante inventée (statut « à valider par un spécialiste ») ;
toute traduction faite par l'IA est marquée « traduction automatique, à relire » ; aucune installation sans le patron.

## Étape 1 — Conception (sans code)
- [x] Analyste : cahier des charges multilingue + terminologie (docs/conception/cahier-des-charges-langues.md), reprenant les 12 critères d'acceptation de l'exigence 02
- [x] Analyste : liste des questions ouvertes pour le patron (stack, hébergement, sources de traductions, spécialistes validateurs) dans docs/conception/questions-patron.md
- [x] Architecte : proposer 2 ou 3 options de stack (frontend, backend, i18n, tests) avec avantages/limites, sans rien installer (docs/conception/choix-stack.md)
- [x] Choix de la stack par le patron (option A le 2026-10-28) (prérequis à toutes les tâches de code ; implique l'installation de bibliothèques)
- [x] Architecte : modèle de données « langue » (code BCP 47, nom natif, direction, écritures, variantes, 8 niveaux de prise en charge, langues de remplacement, identifiant interne pour dialectes sans code officiel)
- [x] Architecte : modèle de données « terme » du dictionnaire (13 champs de l'exigence 01 §9 + statut de validation + version)
- [x] Architecte : modèle de données « texte original / traduction » (langue, traducteur, source, édition, droits, provenance : humaine publiée / humaine validée / automatique / automatique relue / original non traduit)
- [x] Architecte : structure des dossiers (données de langues, fichiers de traduction versionnés, dictionnaire séparés du code) + décision notée dans decisions.md
- [x] Architecte : règles de translittération (norme retenue, graphies alternatives) à soumettre à un spécialiste
- [x] Designer-ux : parcours du sélecteur de langue (en-tête + paramètres du compte, nom natif + nom traduit, recherche par nom/code, filtres région/écriture, badges de disponibilité)
- [x] Designer-ux : parcours des 3 préférences indépendantes (interface / rapport / langues de recherche)
- [x] Designer-ux : affichage d'un terme technique (format « Terme (arabe — translittération) : définition », infobulle en vue compacte) et d'une traduction IA (bandeau d'avertissement)
- [x] Designer-ux : maquette texte d'un rapport mixte arabe + français + références + URL (règles RTL/LTR par bloc)

## Étape 2 — Code, une brique par tâche (après le choix de la stack)
- [x] Tech-lead : squelette du projet selon la stack validée (nécessite installation du framework choisi → validation patron)
- [x] Tech-lead : fichier de données du catalogue de langues (8 langues de lancement + liste priorité 2 au niveau « identifiée » seulement)
- [x] Tech-lead : validateur de schéma du catalogue de langues (nécessite éventuellement installation d'une bibliothèque de validation → validation patron)
- [x] Tech-lead : fichiers de traduction de l'interface ar (référence) + en + fr, textes de départ minimaux, ceux écrits par l'IA marqués « traduction automatique, à relire »
- [x] Tech-lead : fichiers de traduction es, ur, id, ms, tr — chaque libellé marqué « traduction automatique, à relire » tant qu'un humain ne l'a pas validé
- [x] Tech-lead : chargement i18n (arabe par défaut, chargement des fichiers à la demande, langue de remplacement) (nécessite installation d'une bibliothèque i18n → validation patron)
- [x] Tech-lead : gestion de la direction RTL/LTR au niveau de la page et de chaque bloc de texte (attributs dir/lang, sans inverser les chaînes)
- [x] Tech-lead : polices compatibles arabe/ourdou (Nastaliq)/latin (nécessite téléchargement de polices → validation patron)
- [x] Tech-lead : composant sélecteur de langue alimenté par le catalogue (pas de liste codée en dur), changement sans perdre recherche/filtres/rapport
- [ ] Tech-lead : recherche et filtres dans le sélecteur (nom, nom natif, code, région, écriture) + badges de niveau de prise en charge
- [ ] Tech-lead : mémorisation de la préférence (compte connecté et visiteur) — visiteur fait ; compte connecté : pas encore de comptes
- [x] Tech-lead : séparation des 3 préférences (interface / rapport / recherche documentaire) dans l'état de l'application
- [x] Tech-lead : fichier de données du dictionnaire terminologique, structure seulement, avec les termes listés dans l'exigence 01 en statut « à valider par un spécialiste »
- [x] Tech-lead : validateur de schéma du dictionnaire (champs obligatoires, arabe présent, translittération présente, pas de doublon d'identifiant ni de variante)
- [x] Tech-lead : composant d'affichage d'un terme (format obligatoire selon la langue, infobulle en vue compacte)
- [ ] Tech-lead : modèle texte original / traductions avec statut de provenance (5 statuts de l'exigence 03 §9) — 4 statuts en place, manque « original non traduit »
- [x] Tech-lead : affichage original + traduction séparés, bandeau « traduction automatique » et message « aucune traduction vérifiée » si absente
- [x] Tech-lead : script de détection des traductions manquantes ou en trop par langue, avec taux de complétude par langue
- [x] Tech-lead : script de contrôle terminologique d'un texte (terme technique sans arabe ou sans translittération → signalé)
- [x] Testeur : tests du catalogue et de son validateur (nécessite installation d'un outil de test → validation patron si pas fourni par la stack)
- [x] Testeur : tests de changement de langue (arabe au premier lancement, état conservé après changement)
- [ ] Testeur : tests RTL/LTR et textes mixtes (arabe + latin + chiffres + URL, caractères combinés)
- [x] Testeur : tests du dictionnaire et de son validateur
- [ ] Testeur : tests de séparation original/traductions et du marquage des traductions IA
- [x] Testeur : tests de la détection des traductions manquantes
- [x] Livraison : documentation « ajouter une langue sans reconstruire l'application » (docs/ajouter-une-langue.md)
- [x] Livraison : documentation « ajouter ou corriger un terme du dictionnaire »
- [ ] Livraison : relecture finale contre les 12 critères d'acceptation de l'exigence 02

## Étape 3 — Validation humaine (hors autopilote)
- [!] Validation des termes du dictionnaire par un spécialiste des sciences du hadith (personne à désigner par le patron)
- [!] Relecture humaine des traductions d'interface es, ur, id, ms, tr (relecteurs à trouver par le patron)

## Étape 4 — Écrans de la maquette (2026-10-29)
- [x] Écrans « Recherche par chaîne » et « Rapport » d'après la maquette (PR #1)
- [x] Filtres actifs sur la page Résultats (PR #2)
- [x] Menu : page en cours signalée (aria-current)
- [!] Ajouter d'autres hadiths au corpus d'exemple : texte, chaînes et jugements à fournir depuis une source vérifiée (spécialiste), rien ne doit être inventé
- [x] Textes arabes tronqués (reste de chaîne), textes provisoires entre crochets, titre du rapport, « français — français » (branche fix/textes-et-libelles)
