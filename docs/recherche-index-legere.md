# Recherche à index léger — Milaghaiba / Mina Gaiba 2

## Principe

Les données anciennes de \`data/hadiths\` et \`data/transmetteurs\` ne sont pas modifiées.

L'index statique se trouve dans \`data/search-index/\`. Il est construit à partir
de l'édition externe épinglée \`fawazahmed0/hadith-api@1\`.

- **Index** : numéro du hadith, livre, rang dans le livre, dictionnaire de mots normalisés et
  listes de numéros compressées en varints/base64. **Pas de textes complets.**
- **Recherche** : intersection des numéros associés aux mots de la requête (AND), puis
  pagination sur les références identifiées.
- **Affichage** : télécharge uniquement les notices visibles (10 par page),
  sans charger les recueils entiers en mémoire pour chaque recherche.
- **Correspondance arabe/français** : on présente un lien correspondant **uniquement si**
  le numéro global, le numéro du livre et le rang dans le livre concordent dans les deux index.
  C'est une concordance d'identifiants d'édition, **pas** une validation de sens,
  d'isnād ou d'authenticité.
- **Dégradation** : si un index n'est pas disponible, l'ancien moteur de recherche distante
  continue de fonctionner ; si un texte isolé ne répond pas, sa référence reste accessible.
- **Langues** : la première série d'index cible les 7 éditions arabes et les 6 éditions
  françaises disponibles. Les autres langues conservent l'accès distant précédent.

## Reconstruire

La workflow GitHub Actions \`.github/workflows/build-hadith-search-index.yml\`
peut être exécutée manuellement. Elle se déclenche aussi quand le script change :

\`\`\`bash
node scripts/build-hadith-search-index.mjs
\`\`\`

Elle prend les textes complets **temporairement sur le runner GitHub**, les transforme
en index compact, contrôle 13 éditions et le poids cumulé (limite 65 MiB), puis commite
\`data/search-index/\` sur \`mina-gaiba-2\`.

Le site Render se redéploie après le commit de l'index. Aucune base PostgreSQL
ni copie permanente des recueils complets n'est requise.

## Sources et limites

- Texte upstream : https://github.com/fawazahmed0/hadith-api
- Révision source : \`@1\`
- API : \`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/\`
- Recueils : Bukhārī, Muslim, Abū Dāwūd, Tirmidhī (arabe seulement), Nasāʾī,
  Ibn Mājah et Mālik.

Les recherches par traduction française n'ont **pas** de correspondance sémantique
automatique avec l'arabe. Les éditions peuvent différer dans leur numérotation.
Les traductions peuvent avoir des droits de redistribution particuliers ; leur
présence dans un dépôt public n'accorde pas automatiquement de tels droits.
Les jugements d'authenticité doivent être attribués à leurs auteurs, non déduits
par le moteur de recherche.
