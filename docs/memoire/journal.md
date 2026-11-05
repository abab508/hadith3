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

## 2026-11-04 — Refonte « nuit et or » d'après la maquette du patron
- Fait : charte nuit et or, police Aref Ruqaa, en-tête, accueil immersif (profondeur, rayons, brume, étoiles filantes, titre arabe tracé, ambiance sonore en code), Bibliothèque des 92 recueils, pages Thèmes, Thème, Chapitres, Chapitre, Index A-Z ; images découpées dans la maquette et textes imprimés floutés.
- Vérifié : typecheck, 128 tests unitaires, contrôle, build (tests navigateur : voir rapport) ; contenu des chapitres marqué « à fournir », aucun chiffre inventé.
- Prochaine étape : avis du patron, puis commit et fusion après accord (branche claude/milaghaiba-motion-design-aef3d2).

## 2026-11-04 — Section « Rapport détaillé du hadith » d’après la capture du patron
- Fait : polices Alegreya + Cinzel, emblème doré Milaghaiba (en-tête et bannière), page Rapport en cadres dorés (onglets Biographie / Fiabilité, relations cliquables, bouton doré, barre Navigation thématique), aperçu de la chaîne sur l’accueil.
- Vérifié : 128 tests unitaires, contrôle, build, 58/61 tests navigateur (3 échecs glossaire et filtres de recherche, fichiers non modifiés dans cette session).
- Prochaine étape : avis du patron, puis commit après accord ; corriger ou faire corriger les 3 tests en échec.

## 2026-11-04 — Tests navigateur remis au vert
- Fait : glossaire (fiche arabe = terme + définition, test précisé) ; recherche (une carte par hadith avec ses références depuis 7f24c2b, test mis à jour). Aucun code du site modifié.
- Vérifié : build et 61/61 tests navigateur.
- Prochaine étape : relecture et fusion de la PR n° 17 par le patron.

## 2026-11-04 — Affichage téléphone de la refonte
- Fait : plus de débordement horizontal (grilles de l’en-tête et de Chapitres), actions de l’en-tête resserrées, choix clair/sombre masqué sous 520 px, lueurs mal placées retirées sur téléphone.
- Vérifié : 10 pages à 375 px sans débordement, 128 tests unitaires, build, 61/61 tests navigateur.
- Prochaine étape : PR de ce correctif après accord du patron.

## 2026-11-04 — Provenance des traductions (exigence 03 §9)
- Fait : 5e statut « original non traduit » affiché et testé ; une traduction « validée » n'est plus présentée comme « publiée », une traduction IA « relue » n'est plus présentée comme simple IA (8 langues).
- Vérifié : 130 tests unitaires, contrôle, build, 64/64 tests navigateur (3 nouveaux : séparation original/traduction, original non traduit, textes mixtes en arabe).
- Prochaine étape : test des URL dans un texte arabe ; relecture finale contre les 12 critères de l'exigence 02.

## 2026-11-04 — Recherche par chaîne simplifiée
- Fait : page épurée à la demande du patron (cadre « Votre recherche » + aperçu visuel de la chaîne qui s’allume, bibliothèques repliées dans « Options avancées », plus de grands blocs de texte arabe).
- Vérifié : 130 tests unitaires, build, 64/64 tests navigateur.
- Prochaine étape : avis du patron sur le rendu, puis PR.

## 2026-11-04 — Recherche par chaîne : retrouver le hadith par un mot ou un numéro
- Fait : champ « Chercher le hadith » (mot arabe avec ou sans voyelles, traduction, numéro) qui réutilise le moteur de la page Recherche ; les hadiths trouvés se choisissent d’un clic, l’aperçu de la chaîne suit.
- Vérifié : 130 tests unitaires, build, 65/65 tests navigateur.
- Prochaine étape : avis du patron, envoi dans la PR n° 20.

## 2026-11-04 — URL dans les textes arabes et relecture finale de l'exigence 02
- Fait : composant TexteMixte (URL isolées en LTR, jamais raccourcies, ponctuation arabe hors du lien) branché sur les textes rédigés des rapports ; relecture des 12 critères dans docs/livraison/relecture-exigence-02.md (12/12 conformes et testés, limites listées).
- Vérifié : 134 tests unitaires, 9 contrôles, build, 65/65 tests navigateur.
- Prochaine étape : relecture humaine des traductions, validation des termes, tests automatiques sur chaque PR.

## 2026-11-04 — Recherche par chaîne : toute la base
- Fait : la recherche du hadith interroge aussi les 245 récits importés (texte arabe seul) ; un récit choisi affiche son texte, la mention « chaîne pas encore analysée » et le lien vers la source, sans faux rapport ; conseil de chercher en arabe quand un mot français ne donne rien. Mise en ligne : PR n° 21 fusionnée, site Render basculé sur la version nuit et or (mina-gaiba-2 = 35c6d96).
- Vérifié : 134 tests unitaires, build, 66/66 tests navigateur.
- Prochaine étape : PR de ce changement ; traductions françaises des récits à fournir depuis une source vérifiée pour chercher en français.

## 2026-11-04 — Recherche dans toute la base des grands recueils
- Fait : « boire » ou un numéro cherche dans 7 grands recueils (index hadith-api) ; page d'un hadith (arabe, traduction, appréciations publiées) avec bouton « Rapport et chaîne de transmission » ; page du rapport avec la chaîne découpée du texte arabe ; « Recherche par chaîne » retirée du menu.
- Vérifié : 138 tests unitaires, 9 contrôles, build, 67/67 tests navigateur ; parcours boire → hadith → rapport vu à l'écran (Bukhārī 22, 53, Muslim 100).
- Prochaine étape : PR et mise en ligne après accord ; vérifier sur Vercel que l'index (11 Mo) est bien embarqué.

## 2026-11-04 — Rapport des hadiths des recueils dans la mise en page de la capture
- Fait : la page « Rapport et chaîne de transmission » reprend la disposition du rapport détaillé (bannière, chaîne en cartes avec flèches dans un cadre doré, fiche du transmetteur avec Biographie / Fiabilité, maîtres et élèves dans la chaîne, barre Navigation thématique) ; couleurs nuit et or inchangées.
- Vérifié : 138 tests unitaires, 9 contrôles, build, 67/67 tests navigateur.
- Prochaine étape : mise en ligne après accord du patron.

## 2026-11-04 — Fiches des transmetteurs remplies depuis hadith-kg
- Fait : biographie (nom complet, kunya, ṭabaqa, naissance, décès, nisba, résidence, nombre de récits) et fiabilité (jugement de synthèse + jugements des critiques cités) pour 6 231 transmetteurs ; chaîne reliée pour 26 771 hadiths des 7 grands recueils ; secours : découpage du texte.
- Vérifié : 141 tests unitaires, contrôles, build ; capture Bukhārī 22 (Ismāʿīl ibn Abī Uways).
- Prochaine étape : mise en ligne après accord du patron.

## 2026-11-04 — Liaison des chaînes hadith-kg vérifiée par les noms
- Fait : 33 652 hadiths sur 36 390 reliés (92 %, contre 74 %) ; la chaîne retenue est celle dont les noms sont écrits dans le hadith ; corrige des chaînes fausses déjà en ligne (ex. Bukhārī 7 et 27).
- Vérifié : 142 tests unitaires, 9 contrôles, build, 67/67 tests navigateur ; capture Bukhārī 7.
- Prochaine étape : mise en ligne après accord du patron.

## 2026-11-04 — Bukhārī 1010 relié (recherche des candidats élargie)
- Fait : candidats hadith-kg choisis aussi par le nombre de mots rares partagés (40 mots, 25 meilleures entrées) ; Bukhārī 1010 a ses fiches ; aucun lien perdu (33 653 reliés).
- Vérifié : 143 tests unitaires, 9 contrôles, build, 67/67 tests navigateur.
- Prochaine étape : mise en ligne après accord ; choix d'hébergement pour les autres recueils de la bibliothèque.

## 2026-11-04 — 43 recueils de la bibliothèque lisibles, avec chaînes et fiches
- Fait : dépôt de données public abab508/milaghaiba-donnees (tag v1, servi par jsDelivr) : 273 984 hadiths de 43 recueils hadith-kg, chaînes et 22 134 fiches ; pages /recueil/<id>, /recueil/<id>/<n> et rapport ; lien « Lire les hadiths » dans la bibliothèque.
- Vérifié : 147 tests unitaires, 9 contrôles, build, 68/68 tests navigateur ; captures Musnad Aḥmad.
- Prochaine étape : mise en ligne après accord ; 42 recueils du catalogue absents de hadith-kg (imamites, compilations sans chaîne…).

## 2026-11-04 — Site limité aux recueils sunnites
- Fait : 24 recueils imamites et ibadites retirés du catalogue (92 → 68) avec leurs rayons ; recueil ibadite d'al-Rabīʿ ibn Ḥabīb retiré des données (42 recueils hadith-kg).
- Vérifié : 147 tests unitaires, 9 contrôles, build, 68/68 tests navigateur ; capture de la bibliothèque.
- Prochaine étape : envoi du dépôt de données (tag v2) et mise en ligne après accord du patron.

## 2026-11-04 — Biographies en lettres latines, auteur du recueil corrigé, ibadites effacés en ligne
- Fait : noms, nisba et lieux des fiches en lettres latines (avec l'arabe dessous) pour les langues en écriture latine ; tables de 2 088 mots et 250 lieux (IA, à relire), champ laissé en arabe si un mot est inconnu ; « Auteur du recueil » seulement pour l'auteur principal (sinon carte du recueil en fin de chaîne) ; historique du dépôt de données réécrit sans le recueil ibadite.
- Vérifié : 153 tests unitaires, 9 contrôles, build, 68/68 tests navigateur ; capture Bukhārī 1010 (Anas ibn Mālik).
- Prochaine étape : mise en ligne après accord ; suppression complète de l'ancien commit du dépôt de données (droit GitHub delete_repo à accorder par le patron).

## 2026-11-05 — Chapitres et sous-chapitres pour tous les thèmes, illustrations, audio/vidéo
- Fait : 284 chapitres et 2 714 sous-chapitres (index « موضوعات الحديث الشريف » de hadith-kg) pour les 9 thèmes, titres français (IA, à relire) ; pages chapitre (galerie de 3 illustrations SVG, sous-chapitres, références par recueil, présentation animée + voix de synthèse) et sous-chapitre (hadiths paginés avec texte arabe, traduction française si disponible, bouton Écouter).
- Vérifié : 161 tests unitaires, 9 contrôles, build, 107/107 tests navigateur ; captures thème Adoration, chapitre Prière, sous-chapitre peste.
- Prochaine étape : mise en ligne après accord du patron ; explications (charḥ) à fournir par un spécialiste.
