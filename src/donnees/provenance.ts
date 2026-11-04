import type { Hadith } from "@/donnees/schemas/corpus";

// Les 5 provenances de l'exigence 03 §9 : quatre pour une traduction présente,
// une cinquième quand seul l'original arabe existe dans la langue demandée.
export type Provenance = Hadith["traductions"][number]["origine"] | "original-non-traduit";

// Mention affichée sous chaque texte : jamais une validation ou une publication qui n'existe pas.
export const clesMention = {
  publiee: "traduction.publiee",
  validee: "traduction.validee",
  ia: "traduction.ia",
  "ia-relue": "traduction.iaRelue",
  "original-non-traduit": "traduction.originalNonTraduit",
} as const satisfies Record<Provenance, string>;

export function provenance(hadith: Pick<Hadith, "traductions">, langue: string) {
  const traduction = hadith.traductions.find((x) => x.langue === langue);
  return traduction
    ? { statut: traduction.origine as Provenance, traduction }
    : { statut: "original-non-traduit" as const, traduction: undefined };
}
