# Déployer Mina Gaiba 2 sur Netlify

Ce dépôt contient l'application **Mina Gaiba 2**, sur la branche `mina-gaiba-2`.
Le site historique **Milaghaiba** reste sur la branche `main` : ne pas remplacer la branche lors de la configuration.

## Importation depuis GitHub

1. Ouvrir https://app.netlify.com/start/deploy?repository=https://github.com/abab508/hadith3&branch=mina-gaiba-2
2. Se connecter à Netlify et autoriser l'installation GitHub sur `abab508/hadith3`.
3. Vérifier **Production branch = mina-gaiba-2**.
4. Build command : `npm run build`. Publish directory : `.next`.
5. Site name : **mina-gaiba-2** si disponible (sinon autre nom libre).
6. Lancer le déploiement puis vérifier les chemins `/ar`, `/fr`, `/fr/recherche` et `/fr/admin/import`.
7. Dans Project configuration > Developer settings > Continuous deployment > Branches and deploy contexts, désactiver les déploiements des autres branches (Branch deploys : None). Conserver les déploiements de prévisualisation uniquement si souhaités.

Netlify détecte normalement Next.js et ses fonctionnalités serveur. Ne pas utiliser `next export`, `output: export`, de règle de redirection universelle ni l'ancien adaptateur Next.js.

## Activer l'import sécurisé des hadiths

L'interface d'import CSV et ses API sont présentes mais l'écriture est volontairement **désactivée** sans les variables serveur :

- `HADITH_ADMIN_PASSWORD` : mot de passe administrateur long, 16 caractères minimum.
- `HADITH_IMPORT_SESSION_SECRET` : secret aléatoire de 32 caractères minimum.
- `HADITH_IMPORT_GITHUB_TOKEN` : jeton GitHub fine-grained, limité à `abab508/hadith3`, permission **Contents: Read and write**.

Les saisir dans **Netlify > Project configuration > Environment variables**, en variables privées pour les fonctions. Ne jamais les enregistrer dans le dépôt, un fichier CSV ou le chat. Relancer un déploiement après les avoir ajoutées.

La sauvegarde écrit uniquement dans `data/hadiths/index-imports.json`, sur la branche `mina-gaiba-2`, et refuse les doublons ou les conflits de SHA. Le dépôt GitHub reste le stockage durable ; les fonctions Netlify n'utilisent pas le disque pour conserver les données.

## Déploiements, sécurité et limites

- En l'absence de secrets, la consultation publique du catalogue fonctionne, la connexion admin et la sauvegarde restent verrouillées.
- La limite d'essais de connexion actuelle est en mémoire par fonction ; utiliser des protections Netlify supplémentaires si le site est exposé à un trafic élevé.
- Chaque commit GitHub sur la branche de production peut déclencher un build Netlify, soumis aux quotas du forfait choisi.
- La détection de doublon vérifie identifiants et références, mais ne certifie pas l'authenticité religieuse d'un hadith.
- Les modifications sur `main` ne doivent pas être automatiquement publiées comme Mina Gaiba 2.

Documentation Netlify : https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
