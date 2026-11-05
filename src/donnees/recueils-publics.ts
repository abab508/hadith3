/**
 * Recueils lus depuis les éditions publiques hadith-api (fawazahmed0, Unlicense) : les 7 grands recueils
 * et les 40 hadiths d'an-Nawawī. Le site ne garde que le sommaire (data/recueils-publics/sommaires.json,
 * scripts/exporter-sommaires-publics.mjs) ; les textes sont lus à la demande chez la source.
 * Numérotation = celle de l'édition publique, la même que les pages /hadith/<recueil>/<langue>/<n>.
 */
import brut from "../../data/recueils-publics/sommaires.json" with { type: "json" };
import { EXTERNAL_COLLECTIONS, type CollectionPublique } from "@/donnees/recherche-distante";

// Les 40 hadiths d'an-Nawawī : lisibles, mais hors du moteur de recherche (pas d'index construit).
export const COLLECTIONS_LECTURE: readonly CollectionPublique[] = [
  ...EXTERNAL_COLLECTIONS,
  { id: "al-arbain-an-nawawiyya", key: "nawawi", nom: "Al-Arbaʿīn an-Nawawiyya", fr: true },
];

// [numéro du livre dans la source, titre donné par la source (anglais, parfois vide), nombre de hadiths]
export type LivrePublic = [number, string, number];
export type SommairePublic = { cle: string; total: number; dernier: number; livres: LivrePublic[] };

// Contrôle du fichier au chargement : un sommaire mal formé arrête le build plutôt que d'afficher du faux.
function charger(donnees: unknown): Record<string, SommairePublic> {
  const recueils = (donnees as { recueils?: Record<string, SommairePublic> }).recueils ?? {};
  for (const [id, r] of Object.entries(recueils)) {
    const ok = typeof r.cle === "string" && Number.isSafeInteger(r.total) && Number.isSafeInteger(r.dernier) && Array.isArray(r.livres)
      && r.livres.every((l) => Array.isArray(l) && l.length === 3 && Number.isSafeInteger(l[0]) && typeof l[1] === "string" && Number.isSafeInteger(l[2]));
    if (!ok) throw new Error(`Sommaire public invalide : ${id}`);
    // Les hadiths « hors livre » de la source (section 0) viennent après les livres numérotés.
    r.livres = [...r.livres.filter((l) => l[0] !== 0), ...r.livres.filter((l) => l[0] === 0)];
  }
  return recueils;
}

const sommaires = charger(brut);

export function recueilPublic(id: string): { collection: CollectionPublique; sommaire: SommairePublic } | null {
  const collection = COLLECTIONS_LECTURE.find((c) => c.id === id);
  const sommaire = Object.hasOwn(sommaires, id) ? sommaires[id] : undefined;
  return collection && sommaire && sommaire.cle === collection.key ? { collection, sommaire } : null;
}
