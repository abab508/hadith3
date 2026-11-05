/**
 * Correspondances explicites vers des clés de traduction complètes (docs/memoire/conventions.md :
 * « jamais de clé construite par concaténation »). Chaque clé est écrite en entier pour que les contrôles
 * de traduction la retrouvent ; une valeur inconnue retombe sur une clé de secours explicite.
 */
const choisir = <T extends Record<string, string>>(table: T, secours: T[keyof T]) =>
  (cle: string | null | undefined): T[keyof T] => (cle && Object.hasOwn(table, cle) ? table[cle as keyof T] : secours);

// actualites.rubriques.*
export const CLES_RUBRIQUES = {
  article: "rubriques.article", actualite: "rubriques.actualite", information: "rubriques.information",
} as const;

// biographies.series.*
export const CLES_SERIES = {
  prophetes: { titre: "series.prophetes.titre", description: "series.prophetes.description" },
  compagnons: { titre: "series.compagnons.titre", description: "series.compagnons.description" },
  successeurs: { titre: "series.successeurs.titre", description: "series.successeurs.description" },
  atba: { titre: "series.atba.titre", description: "series.atba.description" },
  savants: { titre: "series.savants.titre", description: "series.savants.description" },
} as const;

// assistant.erreurs.* (codes renvoyés par /api/assistant)
export const cleErreurAssistant = choisir({
  trop: "erreurs.trop", occupe: "erreurs.occupe", refus: "erreurs.refus", invalide: "erreurs.invalide", indisponible: "erreurs.indisponible",
}, "erreurs.indisponible");

// adminContenus.types.* et adminContenus.erreurs.* (codes renvoyés par /api/admin/…)
export const CLES_TYPES_CONTENU = { article: "types.article", actualite: "types.actualite", information: "types.information" } as const;
export const cleErreurContenus = choisir({
  "mot-de-passe": "erreurs.motDePasse", trop: "erreurs.trop", "non-configure": "erreurs.nonConfigure", connexion: "erreurs.connexion",
  base: "erreurs.base", stockage: "erreurs.stockage", invalide: "erreurs.invalide", "trop-gros": "erreurs.tropGros", "pas-pdf": "erreurs.pasPdf",
  origine: "erreurs.origine", introuvable: "erreurs.introuvable", serveur: "erreurs.serveur",
}, "erreurs.serveur");

// forum.erreurs.* (codes renvoyés par /api/forum/…)
export const cleErreurForum = choisir({
  connexion: "erreurs.connexion", invalide: "erreurs.invalide", trop: "erreurs.trop", ferme: "erreurs.ferme",
  introuvable: "erreurs.introuvable", indisponible: "erreurs.indisponible", origine: "erreurs.origine", serveur: "erreurs.serveur",
}, "erreurs.serveur");

// compte.erreurs.* (codes renvoyés par /api/compte)
export const cleErreurCompte = choisir({
  identifiants: "erreurs.identifiants", bloque: "erreurs.bloque", code: "erreurs.code", "email-pris": "erreurs.emailPris",
  "nom-pris": "erreurs.nomPris", invalide: "erreurs.invalide", trop: "erreurs.trop", indisponible: "erreurs.indisponible",
  connexion: "erreurs.connexion", origine: "erreurs.origine", serveur: "erreurs.serveur",
}, "erreurs.serveur");

// adminForum.erreurs.* et adminForum.onglets.*
export const cleErreurAdminForum = choisir({
  "mot-de-passe": "erreurs.motDePasse", trop: "erreurs.trop", "non-configure": "erreurs.nonConfigure", connexion: "erreurs.connexion",
  base: "erreurs.base", invalide: "erreurs.invalide", origine: "erreurs.origine", introuvable: "erreurs.introuvable", serveur: "erreurs.serveur",
}, "erreurs.serveur");
export const CLES_ONGLETS_FORUM = {
  retenus: "onglets.retenus", discussions: "onglets.discussions", membres: "onglets.membres", invitations: "onglets.invitations", mots: "onglets.mots",
} as const;

// forum.regles.*
export const CLES_REGLES = ["regles.r1", "regles.r2", "regles.r3", "regles.r4"] as const;
