# Journal (une entrée datée par tâche, 3 lignes)

## 2026-10-28
- Fait : exigences HadithVerify AI enregistrées dans docs/exigences/ (01 terminologie, 02 multilingue, 03 couverture mondiale).
- Reste : 47 tâches dans docs/memoire/taches.md (13 conception, 31 code/tests/doc, 3 [!] : choix de la stack, spécialiste hadith, relecteurs de traductions).
- Prochaine étape : autopilote lancé.

## 2026-10-28 — Questions ouvertes pour le patron
- Fait : 12 questions classées par blocage dans docs/conception/questions-patron.md (verdict d'authenticité V1, source des textes arabes, budget, technologies, moteur d'IA, hébergement, comptes, droits des traductions, traduction auto, spécialistes/translittération, relecteurs, langues au lancement).
- Reste : réponses du patron.
- Prochaine étape : le patron répond, à commencer par les questions bloquantes.

## 2026-10-28 — Options de stack
- Fait : docs/conception/choix-stack.md : A Next.js + next-intl (recommandée, à valider), B Vite/React + react-i18next + Fastify, C Vite/React + FastAPI ; données langues et termes en JSON, quelle que soit l'option.
- Reste : choix du patron ; rien installé.
- Prochaine étape : validation de l'option par le patron, puis installation.

## 2026-10-28 — Cahier des charges multilingue
- Fait : docs/conception/cahier-des-charges-langues.md : 63 exigences EX-01..EX-63, 12 critères d'acceptation reliés, 12 hypothèses (section 6).
- Reste : confirmation des hypothèses par le patron.
- Prochaine étape : parcours UX.

## 2026-10-28 — Parcours UX
- Fait : 4 fichiers dans docs/conception/ux/ (sélecteur de langue, 3 préférences, affichage termes/traductions, rapport mixte) ; espaces réservés, aucune définition inventée.
- Reste : contenus réels (définitions, traductions) à fournir par les spécialistes.
- Prochaine étape : modèles de données.

## 2026-10-28 — Modèles de données
- Fait : 4 fichiers dans docs/conception/donnees/ (langue, terme, texte/traduction, translittération provisoire ALA-LC à soumettre à un spécialiste) ; 11 décisions notées.
- Reste : toutes les tâches de code marquées [!], elles attendent le choix de la stack.
- Prochaine étape : le patron choisit la stack.

## 2026-10-29 — Écrans « Recherche par chaîne » et « Rapport » d'après la maquette
- Fait : branche feat/maquette-parcours ; chaîne cliquable + fiche du transmetteur, formulaire en 3 étapes ; 2 erreurs TypeScript corrigées (le build passait pas) ; 3 tests navigateur ajoutés (52/52 OK).
- Reste : clé rapport.colonneAcces en es/id/ms/tr/ur/en/ar = traduction automatique à relire ; filtres de la page Résultats encore inactifs.
- Prochaine étape : le patron relit la branche, puis décide du push / de la fusion.

## 2026-10-29 — 5 hadiths importés de Sanadset 650K
- Fait : al-Bukhārī n° 2, 8, 10, 13, 16 (chaîne unique, texte complet) ; n° 3, 5, 6 écartés car l'extraction automatique y mélange plusieurs chaînes ; aucun jugement ni date inventés (catégorie « non-evalue »).
- Reste : identification et jugements des 25 transmetteurs importés par un spécialiste ; numérotation à vérifier.
- Prochaine étape : validation du patron pour la mise en ligne.

## 2026-10-29 — Vraie recherche dans le corpus
- Fait : la page Résultats cherche dans les 6 hadiths (texte arabe sans voyelles, traductions, références « Bukhari 13 », noms des transmetteurs) ; avant, elle montrait toujours le même exemple.
- Reste : recherche floue (fautes de frappe) et modes de recherche (exacte, fragment…) pas encore distincts.
- Prochaine étape : validation du patron pour la mise en ligne.

## 2026-10-29 — Recherche avancée : recueil, livre, numéro, modes
- Fait : sélecteurs liés recueil → livre (accueil et Résultats) ; un numéro seul (chiffres latins ou arabes) vise le numéro dans le recueil choisi ; les 8 modes de recherche agissent ; livres des 5 hadiths importés renseignés (badʾ al-waḥy, al-Īmān).
- Reste : livres déduits du contenu des hadiths, à confirmer par le spécialiste avec la numérotation.
- Prochaine étape : validation du patron pour la mise en ligne.

## 2026-10-29 — Livres par catégorie et numéros du Taqrīb
- Fait : sélecteur « Livre » = ouvrages hors hadith (rijāl), recherche des transmetteurs par nom ou numéro ; 7 numéros de notice du Taqrīb al-Tahdhīb vérifiés mot pour mot sur ar.wikisource.org (al-Taymī 5691, Yaḥyā ibn Saʿīd 7559, Sufyān 2451, ʿAlqama 4685, al-Ḥumaydī 3320, Mālik 6425, al-Qaʿnabī 3620).
- Reste : Tahdhīb al-Kamāl, Siyar, al-Jarḥ wa-l-taʿdīl : tome/page dépendent de l'édition, non remplis ; numérotation Wikisource à rapprocher d'une édition imprimée.
- Prochaine étape : validation du patron pour la mise en ligne.

## 2026-10-29 — Recherches sans résultat
- Fait : particules arabes (ب و ف ل ك + ال) détachées des mots (« النيات » trouve « بالنيات ») ; traductions fr/en marquées IA pour les 5 hadiths importés ; message d'aide quand rien n'est trouvé.
- Reste : le corpus n'a que 6 hadiths, la plupart des recherches restent vides ; import en nombre à décider ; traductions IA à relire.
- Prochaine étape : validation du patron pour la mise en ligne.

## 2026-10-29 — Textes coupés et textes provisoires
- Fait : début des textes arabes Bukhārī n° 2, 8, 10, 13, 16 nettoyé ; plus de « [tome, page] » ni de « [Bibliothèque partenaire] » ; titre du rapport lisible ; « français — français » supprimé du menu.
- Vérifié : typecheck, 102 tests unitaires, contrôle, build, 61 tests navigateur.
- Prochaine étape : validation du patron pour fusion dans main (= mise en ligne).
