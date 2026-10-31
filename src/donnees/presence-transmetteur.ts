import type { Hadith } from "@/donnees/schemas/corpus";

/** Présence et position d'un maillon dans les voies réellement chargées de CE hadith.
 * Ne déduit ni fiabilité personnelle ni authenticité de la transmission. */
export function presenceDansHadith(hadith: Pick<Hadith, "chaine">, transmetteurId: string) {
  return hadith.chaine.voies.flatMap((voie) => {
    const ids = [...hadith.chaine.tronc, ...voie.transmetteurs];
    const position = ids.indexOf(transmetteurId);
    if (position < 0) return [];
    return [{
      voieId: voie.id,
      ouvrageId: voie.ouvrage,
      numero: voie.numero,
      position: position + 1,
      total: ids.length,
      partieCommune: hadith.chaine.tronc.includes(transmetteurId),
      precedentId: ids[position - 1] ?? null,
      suivantId: ids[position + 1] ?? null,
    }];
  });
}
