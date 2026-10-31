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

/** Forme un exercice (avec un trou) à partir des mots du texte réel.
 * Le texte source reste inchangé et toujours accessible. */
export function questionMemoire(
  extrait: ExtraitMemorisation,
  corpusExtraits: readonly ExtraitMemorisation[],
): { avant: string; apres: string; reponse: string; propositions: [string, string, string] } | null {
  const mots = extrait.texteAr.trim().split(/\s+/u);
  if (mots.length < 3) return null;
  const milieu = Math.floor(mots.length / 2);
  const rang = mots.findIndex((mot, i) => i >= milieu && mot.length >= 5);
  const index = rang >= 0 ? rang : milieu;
  const reponse = mots[index]!;
  const candidats = corpusExtraits
    .filter((e) => e.id !== extrait.id)
    .flatMap((e) => e.texteAr.split(/\s+/u))
    .filter((m) => m.length >= 5 && m !== reponse);
  const faux = [...new Set(candidats)].slice(0, 2);
  if (faux.length < 2) return null;
  const propositions = [reponse, faux[0]!, faux[1]!] as [string, string, string];
  const rotation = corpusExtraits.findIndex((h) => h.id === extrait.id) % 3;
  return {
    avant: mots.slice(0, index).join(" "),
    apres: mots.slice(index + 1).join(" "),
    reponse,
    propositions: [
      propositions[(rotation + 1) % 3]!,
      propositions[(rotation + 2) % 3]!,
      propositions[rotation]!,
    ],
  };
}
