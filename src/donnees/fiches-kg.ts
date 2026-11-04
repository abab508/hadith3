/**
 * Chaînes et fiches des transmetteurs exportées de « الجامع — Hadith Knowledge Graph »
 * (emadjumaah/hadith-kg, CC BY 4.0) par scripts/exporter-fiches-kg.py.
 * Le lien hadith-api -> hadith-kg se fait par le texte arabe, puis par les noms de la chaîne écrits dans le hadith : un hadith
 * non relié n'a pas de chaîne ici. Les jugements sont cités tels qu'ils figurent dans la source.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type FicheKg = {
  id: string; nom: string; kunya?: string; rang?: string; tabaqa?: number; naissance?: string; deces?: string;
  nasab?: string; residence?: string; lieuDeces?: string; riwayat?: number; tadlis?: number; ikhtilat?: number; incomplet?: number;
};
export type JugementKg = { critique: string; texte: string };
export type MaillonKg = FicheKg & { jugements: JugementKg[]; auteur: boolean };

const dossier = () => join(process.cwd(), "data", "transmetteurs-kg");
const memo = new Map<string, Promise<unknown>>();
function lire<T>(fichier: string): Promise<T | null> {
  if (!/^[a-z-]+\.json$/.test(fichier)) return Promise.resolve(null);
  if (!memo.has(fichier)) {
    memo.set(fichier, readFile(join(dossier(), fichier), "utf8").then((t) => JSON.parse(t) as T).catch(() => null));
  }
  return memo.get(fichier) as Promise<T | null>;
}

// Chaîne d'un hadith (clé hadith-api : bukhari, muslim…), du Prophète ﷺ… : ordre Compagnon -> auteur.
export async function chaineKg(cle: string, numero: number): Promise<MaillonKg[] | null> {
  if (!/^[a-z]+$/.test(cle) || !Number.isSafeInteger(numero)) return null;
  const [liens, fiches, jugements] = await Promise.all([
    lire<{ liens: Record<string, number[]> }>(`liens-${cle}.json`),
    lire<{ transmetteurs: Record<string, Omit<FicheKg, "id">> }>("transmetteurs.json"),
    lire<{ jugements: Record<string, [string, string][]> }>("jugements.json"),
  ]);
  const ids = liens?.liens[String(numero)];
  if (!ids || !fiches) return null;
  // Dans la source, la position 0 est l'auteur du recueil ; on renverse pour lire depuis le Compagnon.
  const maillons = ids.map((id, pos) => {
    const f = fiches.transmetteurs[String(id)];
    return f ? { id: String(id), ...f, auteur: pos === 0, jugements: (jugements?.jugements[String(id)] ?? []).map(([critique, texte]) => ({ critique, texte })) } : null;
  });
  if (maillons.some((m) => m === null)) return null;
  return (maillons as MaillonKg[]).reverse();
}

// Catégorie d'affichage déduite du jugement de synthèse de la source (couleur seulement, jamais un verdict nouveau).
export function categorieDepuisRang(m: Pick<MaillonKg, "rang" | "auteur">): "compagnon" | "thiqa" | "saduq" | "daif" | "compilateur" | "non-evalue" {
  if (m.auteur) return "compilateur";
  const r = m.rang ?? "";
  if (/صحاب|له رؤية|له صحبة/u.test(r)) return "compagnon";
  if (/ضعيف|متروك|كذاب|منكر|مجهول|واه|ليس بشيء|وضاع/u.test(r)) return "daif";
  if (/صدوق|لا بأس|مقبول/u.test(r)) return "saduq";
  if (/ثقة|ثبت|حافظ|حجة|إمام|متقن|جبل/u.test(r)) return "thiqa";
  return "non-evalue";
}
