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
// latin : translittération des noms et lieux (src/donnees/translitteration.ts), seulement pour les langues en lettres latines.
export type MaillonKg = FicheKg & { jugements: JugementKg[]; auteur: boolean; latin?: Partial<Record<"nom" | "kunya" | "nasab" | "residence" | "lieuDeces", string>> };

const dossier = () => join(process.cwd(), "data", "transmetteurs-kg");
const memo = new Map<string, Promise<unknown>>();
function lire<T>(fichier: string): Promise<T | null> {
  if (!/^[a-z-]+\.json$/.test(fichier)) return Promise.resolve(null);
  if (!memo.has(fichier)) {
    memo.set(fichier, readFile(join(dossier(), fichier), "utf8").then((t) => JSON.parse(t) as T).catch(() => null));
  }
  return memo.get(fichier) as Promise<T | null>;
}

// Auteur du recueil = premier maillon le plus fréquent, s'il ouvre au moins 80 % des chaînes ; sinon aucun.
// (Certaines chaînes de la source commencent au maître de l'auteur : ce maître n'est pas « l'auteur ».)
const auteurs = new Map<string, number | undefined>();
function auteurPrincipal(cle: string, liens: Record<string, number[]>): number | undefined {
  if (!auteurs.has(cle)) {
    const compte = new Map<number, number>();
    const chaines = Object.values(liens);
    for (const c of chaines) if (c[0] !== undefined) compte.set(c[0], (compte.get(c[0]) ?? 0) + 1);
    const [id, n] = [...compte.entries()].sort((a, b) => b[1] - a[1])[0] ?? [undefined, 0];
    auteurs.set(cle, id !== undefined && n / Math.max(1, chaines.length) >= 0.8 ? id : undefined);
  }
  return auteurs.get(cle);
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
  if (!ids || !fiches || !liens) return null;
  const auteur = auteurPrincipal(cle, liens.liens);
  // Dans la source, la position 0 est l'auteur du recueil ; on renverse pour lire depuis le Compagnon.
  const maillons = ids.map((id, pos) => {
    const f = fiches.transmetteurs[String(id)];
    return f ? { id: String(id), ...f, auteur: pos === 0 && id === auteur, jugements: (jugements?.jugements[String(id)] ?? []).map(([critique, texte]) => ({ critique, texte })) } : null;
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
