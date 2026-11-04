/**
 * Translittération en lettres latines des noms et des lieux des fiches de transmetteurs.
 * Tables data/translitteration/*.tsv (écrites avec l'aide de l'IA, à relire), assemblées par
 * scripts/construire-translitteration.py. Un champ n'est translittéré que si TOUS ses mots sont
 * dans la table : sinon il reste en arabe seulement (aucune devinette).
 */
import brut from "../../data/translitteration/translitteration.json" with { type: "json" };
import { entree } from "@/donnees/catalogue";
import type { MaillonKg } from "@/donnees/fiches-kg";

const tables = brut as { mots: Record<string, string>; lieux: Record<string, string> };

function parMots(texte: string, table: Record<string, string>, separateur: RegExp, jointure: string): string | undefined {
  const groupes = texte.split(/\s*[،,]\s*/u).map((g) => g.trim()).filter(Boolean);
  const sortie: string[] = [];
  for (const groupe of groupes) {
    const mots = groupe.split(separateur).filter(Boolean);
    const latins = mots.map((m) => table[m]);
    if (latins.some((l) => l === undefined)) return undefined;
    sortie.push(latins.join(" "));
  }
  if (sortie.length === 0) return undefined;
  const resultat = sortie.join(jointure);
  // Majuscule en tête (« al- » reste en minuscule, comme dans la translittération savante).
  return resultat.startsWith("al-") ? resultat : resultat.charAt(0).toUpperCase() + resultat.slice(1);
}

export function translitererNom(texte: string | undefined): string | undefined {
  return texte ? parMots(texte, tables.mots, /\s+/u, ", ") : undefined;
}

export function translitererLieux(texte: string | undefined): string | undefined {
  if (!texte) return undefined;
  const lieux = texte.split(/\s*[،,]\s*/u).map((l) => l.trim()).filter(Boolean).map((l) => tables.lieux[l]);
  return lieux.length > 0 && lieux.every((l) => l !== undefined) ? lieux.join(", ") : undefined;
}

// Langues de l'interface écrites en lettres latines : lues dans le catalogue des langues (pas de liste en dur).
export const ecritLatin = (locale: string) => entree(locale)?.ecriture === "Latn";

export type LatinFiche = Partial<Record<"nom" | "kunya" | "nasab" | "residence" | "lieuDeces", string>>;

export function avecLatin<T extends MaillonKg>(maillons: T[], locale: string): (T & { latin?: LatinFiche })[] {
  if (!ecritLatin(locale)) return maillons;
  return maillons.map((m) => {
    const latin: LatinFiche = {
      nom: translitererNom(m.nom),
      kunya: translitererNom(m.kunya),
      nasab: translitererNom(m.nasab),
      residence: translitererLieux(m.residence),
      lieuDeces: translitererLieux(m.lieuDeces),
    };
    const rempli = Object.fromEntries(Object.entries(latin).filter(([, v]) => v)) as LatinFiche;
    return Object.keys(rempli).length > 0 ? { ...m, latin: rempli } : m;
  });
}
