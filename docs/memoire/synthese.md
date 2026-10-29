# Synthèse (tenue par secretaire, 15 lignes max) — mise à jour 2026-10-29
- Projet : Milaghaiba (ex-HadithVerify AI), plateforme de vérification documentaire des hadiths, multilingue, arabe par défaut.
- Exigences : docs/exigences/ (01 terminologie, 02 multilingue, 03 couverture mondiale).
- Conception terminée : cahier des charges (docs/conception/cahier-des-charges-langues.md), questions patron, options de stack (choix-stack.md), UX (docs/conception/ux/), modèles de données (docs/conception/donnees/).
- Avancement : site en ligne sur https://milaghaiba.vercel.app (déploiement automatique de main, dépôt abab508/hadith3) : recherche + filtres, recherche par chaîne, rapport, glossaire, langues, préférences. Détail dans taches.md.
- Décisions récentes : 11 décisions de modèle de données + hypothèses analyste/designer, toutes dans docs/memoire/decisions.md.
- Conflit à trancher : langue initiale du rapport = langue d'interface (analyste H-03) ou arabe (designer) ?
- Attend le patron :
  1. 12 questions dans docs/conception/questions-patron.md.
  2. Un spécialiste hadith (dictionnaire, translittération provisoire ALA-LC, nouveaux hadiths du corpus).
  3. Des relecteurs de traductions.
- Points relevés dans l'exigence 01 : équivalent anglais de ittiṣāl al-sanad manquant ; deux graphies différentes de la lettre ʿayn.
