// Nom affiché d'un recueil d'après son type de référence : « h » = édition hadith-api, « r » = recueil hadith-kg du catalogue.
import { COLLECTIONS_LECTURE } from "@/donnees/recueils-publics";
import { catalogueRecueils } from "@/donnees/recueils";

export function nomRecueil(type: "h" | "r", id: string): string {
  if (type === "h") return COLLECTIONS_LECTURE.find((c) => c.id === id)?.nom ?? id;
  return catalogueRecueils.recueils.find((r) => r.id === id)?.nom ?? id;
}
