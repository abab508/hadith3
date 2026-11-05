/**
 * Biographies : séries de personnes tirées de la base hadith-kg (emadjumaah/hadith-kg, CC BY 4.0),
 * exportées par scripts/exporter-biographies-kg.py dans data/biographies. Rien n'est rédigé :
 * fiches = champs de la source ; maîtres et élèves = voisins directs dans les chaînes de la source.
 * Série des prophètes : chapitres du site dont le titre arabe (source) nomme le prophète.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import brut from "../../data/biographies/series.json" with { type: "json" };
import { normaliser } from "@/donnees/recherche";
import { tousLesChapitresKg, type ChapitreKg, type SousChapitreKg } from "@/donnees/chapitres-kg";

export const SERIES_PERSONNES = ["compagnons", "successeurs", "atba"] as const;
export const SERIES = ["prophetes", ...SERIES_PERSONNES, "savants"] as const;
export type Serie = typeof SERIES[number];
export type SeriePersonnes = typeof SERIES_PERSONNES[number];
export const estSerie = (s: string): s is Serie => (SERIES as readonly string[]).includes(s);

// [id, nom d'usage, nom complet, année de décès (texte de la source), nombre de récits]
export type EntreePersonne = [number, string, string, string, number];
// [id, nom d'usage, nom complet, année de décès, rang donné par la source, nombre de jugements]
export type EntreeCritique = [number, string, string, number, string, number];
export type Voisin = [number, string, number];
export type FicheBio = {
  nom: string; kunya?: string; rang?: string; tabaqa?: number; naissance?: string; deces?: string; age?: string; metier?: string;
  nasab?: string; residence?: string; lieuDeces?: string; riwayat?: number; tadlis?: number; ikhtilat?: number;
  jugements?: [string, string][]; maitres: Voisin[]; eleves: Voisin[]; recueils?: string[];
};

const donnees = brut as unknown as {
  source: string; seau: number;
  series: Record<SeriePersonnes | "auteurs", EntreePersonne[]>;
  recueilsAuteurs: Record<string, string[]>;
  critiques: EntreeCritique[];
};
export const sourceBiographies = donnees.source;
export const personnesDe = (s: SeriePersonnes | "auteurs"): EntreePersonne[] => donnees.series[s];
export const recueilsDeLAuteur = (id: number): string[] => donnees.recueilsAuteurs[String(id)] ?? [];
export const critiques = (): EntreeCritique[] => donnees.critiques;

// Série où la personne apparaît d'abord (pour le lien de retour), sinon null : pas de fiche.
const seriesParId = new Map<number, SeriePersonnes | "auteurs">();
for (const s of [...SERIES_PERSONNES, "auteurs"] as const) for (const [id] of donnees.series[s]) if (!seriesParId.has(id)) seriesParId.set(id, s);
export const aUneFiche = (id: number) => seriesParId.has(id);
export const serieDe = (id: number): Serie | null => {
  const s = seriesParId.get(id);
  return s === undefined ? null : s === "auteurs" ? "savants" : s;
};

export function filtrer(liste: EntreePersonne[], requete: string): EntreePersonne[] {
  const q = normaliser(requete.trim());
  return q ? liste.filter(([, usage, complet]) => normaliser(`${usage} ${complet}`).includes(q)) : liste;
}

const memo = new Map<number, Promise<Record<string, FicheBio> | null>>();
export async function ficheBio(id: number): Promise<FicheBio | null> {
  if (!Number.isSafeInteger(id) || !aUneFiche(id)) return null;
  const seau = Math.floor(id / donnees.seau);
  if (!memo.has(seau)) {
    memo.set(seau, readFile(join(process.cwd(), "data", "biographies", "fiches", `${seau}.json`), "utf8")
      .then((t) => (JSON.parse(t) as { fiches: Record<string, FicheBio> }).fiches).catch(() => null));
  }
  return (await memo.get(seau)!)?.[String(id)] ?? null;
}

// Prophètes, dans l'ordre habituel des récits. Les noms des kunyas et des sourates (Abū Mūsā, sourate Yūsuf…) sont exclus.
const AVANT = "(?<!أبو |أبي |أبا |بن |ابن |بني |بنو |ابني |بنات |سورة |عمل )";
const APRES = "(?! بن| ابن)";
export const PROPHETES: { cle: string; ar: string; latin: string; motif: string }[] = [
  { cle: "adam", ar: "آدم", latin: "Ādam", motif: "آدم" },
  { cle: "idris", ar: "إدريس", latin: "Idrīs", motif: "إدريس" },
  { cle: "nuh", ar: "نوح", latin: "Nūḥ", motif: "نوح" },
  { cle: "hud", ar: "هود", latin: "Hūd", motif: "هود عليه السلام|قوم عاد" },
  { cle: "salih", ar: "صالح", latin: "Ṣāliḥ", motif: "صالح عليه السلام|ناقة صالح|ثمود" },
  { cle: "ibrahim", ar: "إبراهيم", latin: "Ibrāhīm", motif: "إبراهيم|الخليل" },
  { cle: "lut", ar: "لوط", latin: "Lūṭ", motif: "لوط" },
  { cle: "ismail", ar: "إسماعيل", latin: "Ismāʿīl", motif: "إسماعيل" },
  { cle: "ishaq", ar: "إسحاق", latin: "Isḥāq", motif: "إسحاق" },
  { cle: "yaqub", ar: "يعقوب", latin: "Yaʿqūb", motif: "يعقوب" },
  { cle: "yusuf", ar: "يوسف", latin: "Yūsuf", motif: "يوسف" },
  { cle: "ayyub", ar: "أيوب", latin: "Ayyūb", motif: "أيوب" },
  { cle: "shuayb", ar: "شعيب", latin: "Shuʿayb", motif: "شعيب" },
  { cle: "musa", ar: "موسى", latin: "Mūsā", motif: "موسى" },
  { cle: "harun", ar: "هارون", latin: "Hārūn", motif: "هارون" },
  { cle: "dawud", ar: "داود", latin: "Dāwūd", motif: "داود" },
  { cle: "sulayman", ar: "سليمان", latin: "Sulaymān", motif: "سليمان" },
  { cle: "yunus", ar: "يونس", latin: "Yūnus", motif: "يونس|ذي النون|ذا النون" },
  { cle: "zakariyya", ar: "زكريا", latin: "Zakariyyā", motif: "زكرياء|زكريا" },
  { cle: "yahya", ar: "يحيى", latin: "Yaḥyā", motif: "يحيى بن زكريا|يحيى عليه السلام" },
  { cle: "isa", ar: "عيسى", latin: "ʿĪsā", motif: "عيسى|المسيح ابن مريم|نزول المسيح" },
];
export type EntreeChapitre = { href: string; titre: { ar: string; fr: string | null }; nombre: number };

let cacheProphetes: Map<string, EntreeChapitre[]> | null = null;
// Chapitres et sous-chapitres dont le titre arabe nomme le prophète (au plus 40, les plus fournis d'abord).
export function chapitresDesProphetes(): Map<string, EntreeChapitre[]> {
  if (cacheProphetes) return cacheProphetes;
  const resultat = new Map<string, EntreeChapitre[]>();
  const chapitres: ChapitreKg[] = tousLesChapitresKg();
  for (const p of PROPHETES) {
    const re = new RegExp(`${AVANT}(?:${p.motif})${APRES}`, "u");
    const trouves: EntreeChapitre[] = [];
    for (const c of chapitres) {
      if (re.test(c.ar)) trouves.push({ href: `/chapitres/${c.id}`, titre: c, nombre: c.nombre });
      for (const s of c.sous as SousChapitreKg[]) if (re.test(s.ar)) trouves.push({ href: `/chapitres/${c.id}/${s.id}`, titre: s, nombre: s.nombre });
    }
    resultat.set(p.cle, trouves.sort((a, b) => b.nombre - a.nombre).slice(0, 40));
  }
  cacheProphetes = resultat;
  return resultat;
}
