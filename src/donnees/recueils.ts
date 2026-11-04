import brut from "../../data/recueils/catalogue-recueils.json" with { type: "json" };
import { corpus } from "@/donnees/corpus";
import { recueilsKg } from "@/donnees/recueils-kg";
import { fichierRecueils, type FamilleRecueil, type FichierRecueils, type Recueil } from "@/donnees/schemas/recueil";

// « lisible » = nombre de hadiths consultables dans le dépôt de données (hadith-kg), sinon 0.
export type RecueilAffiche = Recueil & { cherchable: boolean; lisible: number };
export type Rayon = { famille: FamilleRecueil; recueils: RecueilAffiche[] };

// Valide le fichier et ses règles de cohérence (numéros 1..n, identifiants uniques, familles déclarées).
export function chargerRecueils(donnees: unknown): FichierRecueils {
  const resultat = fichierRecueils.safeParse(donnees);
  if (!resultat.success) throw new Error(`Catalogue des recueils invalide :\n${resultat.error.message}`);
  const erreurs: string[] = [];
  const ids = new Set<string>();
  resultat.data.recueils.forEach((r, index) => {
    if (r.numero !== index + 1) erreurs.push(`numéro inattendu : ${r.id} (${r.numero})`);
    if (ids.has(r.id)) erreurs.push(`recueil en double : ${r.id}`);
    ids.add(r.id);
    if (!resultat.data.familles.includes(r.famille)) erreurs.push(`${r.id} : famille non déclarée ${r.famille}`);
  });
  if (erreurs.length > 0) throw new Error(`Catalogue des recueils incohérent :\n${erreurs.join("\n")}`);
  return resultat.data;
}

export const catalogueRecueils = chargerRecueils(brut);

// Rayons de la bibliothèque, dans l'ordre des familles ; « cherchable » = présent dans le moteur de recherche.
export function rayons(): Rayon[] {
  const recherchables = new Set(
    corpus.bibliotheques.flatMap((b) => b.ouvrages.filter((o) => o.categorie === "hadith").map((o) => o.id)),
  );
  return catalogueRecueils.familles.map((famille) => ({
    famille,
    recueils: catalogueRecueils.recueils
      .filter((r) => r.famille === famille)
      .map((r) => ({ ...r, cherchable: recherchables.has(r.id), lisible: recueilsKg.get(r.id)?.nombre ?? 0 })),
  }));
}
