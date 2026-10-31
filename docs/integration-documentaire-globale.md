# Intégration documentaire globale — Al-milla al-gha'iba

## État
Plan technique validé ; **aucune connexion à une base de rijāl complète n'est encore en production**. Les rapports actuels extraient certains noms et ne possèdent des biographies détaillées que pour des dossiers locaux sélectionnés.

## Corpus de référence
- https://huggingface.co/datasets/emadjumaah/hadith-kg (CC BY 4.0)
- https://github.com/emadjumaah/hadith
- hadith-kg.db (~1.6 Go) : hadiths, sanads, sanad_rawis, rawis, alems, aqwal, books
- hadith-app.db (~2.9 Go) : recherche et documents complémentaires
- Vérifier les conditions et attributions des textes et traductions associés avant publication.

## Règles obligatoires de rapprochement
1. Le recueil + son édition + son numéro **ne garantissent pas** une identité commune entre corpus.
2. Comparer les références, la matn arabe normalisée, les chaînes et leurs variantes pour identifier un hadith.
3. La personne doit être identifiée par `rawi.id` de la source et par cohérence avec ses maîtres/élèves, pas par le seul nom ni un nom abrégé.
4. Un nom extrait automatiquement doit rester 'non vérifié' jusqu'à une correspondance solide.
5. Séparer avis sur le narrateur, avis sur la voie et jugement global du hadith.
6. Toujours conserver citation originale, auteur du jugement, ouvrage, emplacement précis, lien source, provenance et niveau de confiance ; ne pas fusionner les avis divergents.

## Architecture cible
- Héberger la base KG sur un service interne persistant, non sur le Render Free du front.
- API serveur : `GET /api/hadith/:id`, `GET /api/rawi/:id`, `GET /api/group/:id/tree`. Vérifier les schémas réels dans le projet source.
- Adaptateur interne Next.js : `resolveHadith({recueil,edition,numero,texteAr})` -> identifiant canonique + preuves de correspondance + statut.
- `resolveNarrator({hadithId,sanadId,position})` -> identifiant canonique + preuves; pas d'homonymie automatique.
- Retour : `{ status:'verified'|'ambiguous'|'not-found'|'unavailable', provenance, citations, payload }`.
- Cache court par ID ; timeouts et limite de pagination ; source indisponible affichée distinctement de l'absence de données.
- Ne pas exposer les fichiers SQLite au navigateur ; ne pas accepter une URL arbitraire dans un proxy d'API.

## UX unique pour tous les chemins
- Recherche par mot clé FR / AR et numéro -> résultat -> même rapport canonique.
- Carte de résumé : livre, édition, numéros, classement **attribué** aux auteurs.
- Chaîne : tronc commun et voies sourcées (sinon chaîne apparente explicitement marquée).
- Clic transmetteur -> bulle d'identité, biographies, filiation documentée, maîtres/élèves, jugements contradictoires et références.
- Onglets Biographie / Fiabilité / Sources ; export du rapport avec citations.
- Afficher le pourcentage de couverture documentaire par hadith, jamais inventer les données manquantes.

## Tests de non-régression
- Recherche par « manger » (morphologie et synonymes) ; plusieurs recueils, pagination.
- Même hadith par numéro et mot-clé : URL de rapport et ID canonique identiques.
- Bukhari 22 : résoudre chaque nom complet, « أبيه » dans le contexte, « مالك » sans homonymie, puis vérifier chaque lien.
- Homonymes non résolus : statut ambigu, aucun jugement attribué.
- Sources indisponibles : état d'erreur utile et rapport lisible.
- RTL arabe, accessibilité clavier du dialogue, Escape et retour de focus.
- Tests du rendu imprimé et du mode mobile.

## Mise en production
1. Approvisionner le service KG et monter le volume persistant.
2. Auditer la base et les licences, charger les fichiers hors du front.
3. Configurer une URL privée d'API, secret côté serveur seulement.
4. Écrire et tester l'adaptateur et le résolveur des identités.
5. Basculer progressivement les rapports, puis généraliser.
6. Surveiller taux de résolution, erreurs, latence et coût.
