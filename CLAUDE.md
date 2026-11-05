# CLAUDE.md — Milaghaiba Hadith

## Le projet

Milaghaiba Hadith (ancien nom : HadithVerify AI) est une plateforme multilingue de recherche et de vérification documentaire des hadiths. Le texte arabe original passe en premier, avec ses sources, ses références et la chaîne de transmission (isnad). Les biographies des transmetteurs sont cliquables.

Le site ne donne pas d'avis religieux et ne remplace pas un spécialiste.

## Où se trouve le code

- Dossier local (Windows) : `C:\Users\df\hadith`
- `Dépôt GitHub de référence : abab508/hadith3, branche main (dernière version)`
- `**Ancien dépôt abab508/milaghaiba : ne plus l'utiliser sans demande explicite`**
- `Vercel : projet milaghaiba, relié à GitHub (chaque fusion sur main met le site en ligne)`

## Technique

- Next.js avec next-intl
- 8 langues : ar (par défaut), fr, en, es, ur, id, ms, tr
- L'arabe et l'ourdou s'écrivent de droite à gauche (RTL) : toujours vérifier l'affichage
- Schémas de données avec Zod : bibliothèques, transmetteurs, hadiths

## Design

- Style actuel : nuit et doré (fonds sombres, accents or), avec des touches islamiques algériennes (zellige, calligraphie)
- Fond d'écran style BD (caravane de chameaux, architecture islamique, oasis), modifiable depuis l'admin
- Animations lumineuses et motion design : légères, désactivées si l'utilisateur a choisi « réduire les animations »

## Sources

- Al-Maktaba al-Shāmila, ainsi que Tahdhīb al-Kamāl, Taqrīb al-Tahdhīb, Mīzān al-Iʿtidāl
- Corpus ouverts (comme OpenITI) : texte autorisé
- Éditions protégées : référence et page seulement, sans copier le texte
- Ne jamais inventer un hadith, une référence ou un jugement sur un transmetteur

## Règles de travail

1. Avant de coder, dire quel dépôt et quelle branche tu utilises.
2. Travailler sur une branche, jamais directement sur `main`.
3. Faire une modification à la fois, puis lancer `npm run build` et les tests.
4. Expliquer en français simple : je suis débutant.
5. Donner les commandes pour **PowerShell** (pas CMD), une étape à la fois, et me faire vérifier avec `ls` avant la suite.
6. Ne jamais me demander de mot de passe ni de clé dans la conversation.
7. À la fin, résumer ce qui a été fait et ce qui reste à faire.

## Ce qui reste à faire

- Supprimer le projet Vercel en double mina-gaiba-2 (ses déploiements sont annulés)
- Comptes utilisateurs pour le forum (email, SMS, Google, GitHub)
- Intégrer le motion design commencé dans Claude Code
