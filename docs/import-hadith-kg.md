# Procédure d'import du corpus KG (sans attribution automatique)

Le dépôt du site ne contient pas les fichiers SQLite Hadith Knowledge Graph.

## Préparer les données
1. Obtenir la base depuis la source officielle `emadjumaah/hadith-kg` et conserver sa licence et sa version.
2. Vérifier l'intégrité et les colonnes par `sqlite3 hadith-kg.db '.schema rawis'`.
3. Tester en lecture seule :
```bash
python scripts/export-kg-rawis.py /data/hadith-kg.db --limit 100 > rawis-sample.jsonl
```
4. Ne pas importer directement des jugements dans le front. Les tables `rawis`, `sanads`, `sanad_rawis`, `aqwal` doivent être rapprochées avec leurs clés et leur ordre d'origine. Inspecter le schéma réel.
5. Stocker les données dans un stockage persistant avec contrôle des accès ; garder l'API en accès interne et configurer `HADITH_KG_API_URL` côté serveur, éventuellement `HADITH_KG_API_TOKEN`.
6. Vérifier sur des cas tests la continuité des chaînes et la désambiguïsation avant activation du rapprochement automatique.

## États exposés à l'utilisateur
- `identifié et documenté` : identification appuyée par des clés et références.
- `identifié sans jugement` : biographie possible, fiabilité non inférée.
- `ambigu` : identités candidates, aucun transfert des critiques.
- `non retrouvé` : pas de correspondance.
- `service indisponible` : erreur de connexion distincte des données absentes.

Aucune opération d'achat, aucun changement automatique du plan Render et aucune publication de jugement non documenté.
