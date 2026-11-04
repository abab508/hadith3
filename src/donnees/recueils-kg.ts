/**
 * Recueils de la bibliothèque tirés de « الجامع — Hadith Knowledge Graph » (emadjumaah/hadith-kg, CC BY 4.0),
 * publiés dans le dépôt de données public abab508/milaghaiba-donnees (scripts/exporter-recueils-kg.py).
 * Le site ne garde que l'index (data/recueils-kg/index.json) ; chaque bloc de 100 hadiths et chaque lot
 * de fiches est téléchargé à la demande, puis gardé en cache.
 */
import brut from "../../data/recueils-kg/index.json" with { type: "json" };
import type { FicheKg, MaillonKg } from "@/donnees/fiches-kg";

export type RecueilKg = { id: string; livres: string[]; nombre: number; avecChaine: number; bloc: number };
export type HadithKg = { n: number; ref: number; texte: string; chaines?: number[][]; hukm?: string[] };
type FicheBrute = Omit<FicheKg, "id"> & { jugements?: [string, string][] };

const index = brut as { bloc: number; seau: number; recueils: RecueilKg[] };
export const recueilsKg: ReadonlyMap<string, RecueilKg> = new Map(index.recueils.map((r) => [r.id, r]));
export const TAILLE_BLOC = index.bloc;
const SEAU = index.seau;
// jsDelivr d'abord (CDN), GitHub brut en secours ; version figée « v2 » pour que le cache reste juste.
const SOURCES = [
  "https://cdn.jsdelivr.net/gh/abab508/milaghaiba-donnees@v2/",
  "https://raw.githubusercontent.com/abab508/milaghaiba-donnees/v2/",
];

export const blocDe = (n: number) => Math.ceil(n / TAILLE_BLOC);
export const nombreBlocs = (r: RecueilKg) => Math.ceil(r.nombre / TAILLE_BLOC);

async function lire<T>(chemin: string): Promise<T> {
  let derniere: unknown;
  for (const base of SOURCES) {
    try {
      const res = await fetch(base + chemin, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
      if (!res.ok) throw new Error(`Données : réponse ${res.status}`);
      return (await res.json()) as T;
    } catch (e) { derniere = e; }
  }
  throw new Error("Données des recueils momentanément indisponibles", { cause: derniere });
}

export function validerRecueil(id: string, numero?: string): { recueil: RecueilKg; n?: number } | null {
  const recueil = recueilsKg.get(id);
  if (!recueil) return null;
  if (numero === undefined) return { recueil };
  if (!/^\d{1,6}$/.test(numero)) return null;
  const n = Number(numero);
  return n >= 1 && n <= recueil.nombre ? { recueil, n } : null;
}

export async function blocKg(recueil: RecueilKg, bloc: number): Promise<HadithKg[]> {
  if (!Number.isSafeInteger(bloc) || bloc < 1 || bloc > nombreBlocs(recueil)) return [];
  return (await lire<{ hadiths: HadithKg[] }>(`recueils/${recueil.id}/${bloc}.json`)).hadiths;
}

export async function hadithKg(recueil: RecueilKg, n: number): Promise<HadithKg | null> {
  return (await blocKg(recueil, blocDe(n))).find((h) => h.n === n) ?? null;
}

// Fiches d'une chaîne (ordre de la source : auteur -> Compagnon), rendues du Compagnon vers l'auteur.
export async function maillonsKg(chaine: number[]): Promise<MaillonKg[] | null> {
  const seaux = [...new Set(chaine.map((id) => Math.floor(id / SEAU)))];
  const lots = await Promise.all(seaux.map((s) => lire<{ transmetteurs: Record<string, FicheBrute> }>(`transmetteurs/${s}.json`)));
  const fiches = Object.assign({}, ...lots.map((l) => l.transmetteurs)) as Record<string, FicheBrute>;
  const maillons = chaine.map((id, pos) => {
    const f = fiches[String(id)];
    if (!f) return null;
    const { jugements = [], ...reste } = f;
    return { id: String(id), ...reste, auteur: pos === 0, jugements: jugements.map(([critique, texte]) => ({ critique, texte })) };
  });
  return maillons.some((m) => m === null) ? null : (maillons as MaillonKg[]).reverse();
}

// Début du texte pour la liste d'un recueil (sans voyelles brèves, coupé proprement).
export function extrait(texte: string, longueur = 180): string {
  const t = texte.replace(/[ً-ٰٟ]/gu, "").replace(/\s+/g, " ").trim();
  return t.length <= longueur ? t : `${t.slice(0, t.lastIndexOf(" ", longueur) > 0 ? t.lastIndexOf(" ", longueur) : longueur)}…`;
}
