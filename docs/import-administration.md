# Mina Gaiba 2 — import CSV sécurisé

## Fonctionnement
Route privée par authentification : \`/<langue>/admin/import\` (fr et ar).
Elle fournit une interface CSV, validation locale, prévisualisation, vérification
des doublons via GitHub, sauvegarde atomique dans \`data/hadiths/index-imports.json\`.

La mise à jour ne supprime **aucune donnée**. Si une ligne est invalide, le lot entier
est refusé. Le serveur relit le dernier SHA du fichier avant commit : une écriture
concurrente provoque un refus plutôt qu'un écrasement.

**Attention :** les vérifications de provenance concernent la présence, le format
HTTPS et la référence déclarée par le fichier. Elles ne prouvent pas l'authenticité
des hadiths et ne créent aucune chaîne de transmission.

## Activer la sauvegarde : variables Vercel (Production)

Définir **trois secrets**, côté serveur uniquement, dans :
Vercel → projet mina-gaiba-2 → Settings → Environment Variables.

- \`HADITH_ADMIN_PASSWORD\` : mot de passe long (au moins 16 caractères).
- \`HADITH_IMPORT_SESSION_SECRET\` : secret aléatoire de 32 caractères minimum
  (par exemple généré avec \`openssl rand -hex 32\`).
- \`HADITH_IMPORT_GITHUB_TOKEN\` : **fine-grained GitHub personal access token**
  limité au dépôt **abab508/hadith3**, permission **Contents: Read and write**,
  et expiration courte. Ne jamais l'enregistrer dans le dépôt, le navigateur
  ni le fichier CSV.

Sans ces trois secrets la connexion et la sauvegarde sont désactivées.
Déployer une nouvelle version après ajout des variables d'environnement.
Éviter de partager ces secrets par e-mail ou dans les logs.

## Colonnes CSV

\`recueil,recueilAr,recueilLatin,numero,livreNumero,texteAr,source,fichierSource\`

Optionnel : \`id\`. Sans \`id\`, un identifiant stable est calculé selon le recueil
et le numéro. Le statut est toujours fixé côté serveur à
\`importe-non-verifie\`. Un fichier peut contenir au plus 200 entrées
et peser au plus 500 Ko côté interface. Utiliser UTF-8.
Les valeurs comportant des virgules, retours à la ligne ou points-virgules
doivent être mises entre guillemets CSV doubles.

Un exemple de référence peut pointer vers le fichier source GitHub réellement
utilisé, mais l'outil ne vérifie pas automatiquement que l'URL contient
exactement la narration. La relecture humaine est nécessaire.

## Sécurité et limites

- Session signée côté serveur, cookie HttpOnly, SameSite strict et Secure en production.
- Contrôle d'origine des requêtes mutantes ; aucune clé GitHub en client.
- Validation des paramètres et des doublons côté client **et** serveur.
- Import exclusivement en **ajout** ; aucune commande de suppression.
- Cache désactivé sur les API privées.
- Limitation d'essais de connexion basique *en mémoire*, non globale sur
  plusieurs instances serverless. Pour la production à fort trafic,
  configurer une protection supplémentaire Vercel (WAF/rate limiting).
- La V2 sauvegarde uniquement sur la branche mina-gaiba-2, indépendamment de main. Un ajout provoque un commit GitHub ; le site public ne montre les nouveaux
  textes qu'après un déploiement Vercel réussi. Le quota de déploiement peut
  différer cette mise en ligne.
- L'import actuel couvre **l'index des textes arabes**, pas les dossiers
  de transmetteurs et les isnād détaillés.

## Checklist

1. Créer un jeton GitHub ciblé avec droits minimaux.
2. Renseigner les trois variables Vercel.
3. Déployer la dernière version GitHub.
4. Se connecter à \`/fr/admin/import\`.
5. Télécharger le modèle CSV, le remplir et tester la prévisualisation.
6. Résoudre toute erreur puis enregistrer.
7. Vérifier le commit GitHub et le déploiement Vercel.
