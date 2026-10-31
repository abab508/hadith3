import { corpus, ouvrageParId } from "@/donnees/corpus";

export type ExtraitMemorisation = {
  id: string;
  texteAr: string;
  referenceNumero: string;
  ouvrageAr: string;
  statut: "exemple-a-valider" | "valide-specialiste";
};

/** Copie uniquement de vrais extraits déjà présents dans le corpus validé par Zod.
 * Aucune traduction ni attribution inventée. */
export function extraitsMemorisation(): ExtraitMemorisation[] {
  return corpus.hadiths
    .filter((h) => h.requeteAr.trim().length > 0 && h.occurrences.length > 0)
    .map((h) => {
      const occurrence = h.occurrences.find((o) => o.correspondance === "original") ?? h.occurrences[0]!;
      return {
        id: h.id,
        texteAr: h.requeteAr,
        referenceNumero: occurrence.numero,
        ouvrageAr: ouvrageParId(occurrence.ouvrage)?.nomAr ?? occurrence.ouvrage,
        statut: "exemple-a-valider",
      };
    });
}
