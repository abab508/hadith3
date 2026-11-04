/**
 * Chapitres et sous-chapitres tirés de l'index thématique de hadith-kg (« موضوعات الحديث الشريف »,
 * emadjumaah/hadith-kg, CC BY 4.0), produits par scripts/exporter-chapitres-kg.py.
 * Titres : arabe de la source + traduction française (IA, à relire). Hadiths : rattachés par la source.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import brut from "../../data/chapitres/index.json" with { type: "json" };
import { chaineDeRepli } from "@/donnees/catalogue";
import type { Motif } from "@/composants/IllustrationChapitre";

export type SousChapitreKg = { id: string; ar: string; fr: string | null; nombre: number };
export type ChapitreKg = { id: string; theme: string; ar: string; fr: string | null; sujet: number; nombre: number; sous: SousChapitreKg[] };
type Refs = Record<string, number[]>;

const index = brut as unknown as { source: string; themes: Record<string, string[]>; chapitres: Record<string, Omit<ChapitreKg, "id">> };

export const sourceChapitres = index.source;
// Sous-chapitres du plus riche au moins riche en hadiths (l'ordre de la source est alphabétique).
export const chapitreKg = (id: string): ChapitreKg | undefined => {
  const c = index.chapitres[id];
  return c ? { id, ...c, sous: [...c.sous].sort((a, b) => b.nombre - a.nombre) } : undefined;
};
// Ordre : chapitres « fixes » de la maquette (ids sans préfixe c) d'abord, puis les plus riches en hadiths.
export const chapitresDuThemeKg = (theme: string): ChapitreKg[] => {
  const tous = (index.themes[theme] ?? []).map((id) => chapitreKg(id)!);
  return [...tous.filter((c) => !/^c\d+$/.test(c.id)), ...tous.filter((c) => /^c\d+$/.test(c.id)).sort((a, b) => b.nombre - a.nombre)];
};
export const tousLesChapitresKg = (): ChapitreKg[] => Object.keys(index.chapitres).map((id) => chapitreKg(id)!);
export const sousChapitreKg = (c: ChapitreKg, sid: string) => c.sous.find((s) => s.id === sid);

// Titre affiché : première langue disponible (fr ou ar) dans la chaîne de repli du catalogue des langues.
export function titreKg(e: { ar: string; fr: string | null }, locale: string): { texte: string; langue: "fr" | "ar" } {
  for (const tag of chaineDeRepli(locale)) {
    if (tag === "fr" && e.fr) return { texte: e.fr, langue: "fr" };
    if (tag === "ar") return { texte: e.ar, langue: "ar" };
  }
  return { texte: e.ar, langue: "ar" };
}

// Références d'un chapitre : "h/<id recueil hadith-api>" ou "r/<id recueil hadith-kg>" → numéros.
const memo = new Map<string, Promise<{ sous: Record<string, Refs>; autres: Refs } | null>>();
function lireHadiths(id: string) {
  if (!/^[a-z0-9-]+$/.test(id)) return Promise.resolve(null);
  if (!memo.has(id)) {
    memo.set(id, readFile(join(process.cwd(), "data", "chapitres", "hadiths", `${id}.json`), "utf8").then((t) => JSON.parse(t)).catch(() => null));
  }
  return memo.get(id)!;
}

export type RefHadith = { type: "h" | "r"; recueil: string; numero: number };
const aplatir = (refs: Refs | undefined): RefHadith[] =>
  Object.entries(refs ?? {}).flatMap(([base, nums]) => {
    const [type, recueil] = base.split("/") as ["h" | "r", string];
    return nums.map((numero) => ({ type, recueil, numero }));
  });

export async function hadithsDuSous(id: string, sid: string): Promise<RefHadith[]> {
  return aplatir((await lireHadiths(id))?.sous[sid]);
}
export async function hadithsHorsSous(id: string): Promise<RefHadith[]> {
  return aplatir((await lireHadiths(id))?.autres);
}
// Nombre de hadiths du chapitre par recueil (onglet Références).
export async function repartitionParRecueil(id: string): Promise<{ type: "h" | "r"; recueil: string; nombre: number }[]> {
  const d = await lireHadiths(id);
  if (!d) return [];
  const total = new Map<string, Set<number>>();
  for (const refs of [...Object.values(d.sous), d.autres]) {
    for (const [base, nums] of Object.entries(refs)) {
      const s = total.get(base) ?? new Set<number>();
      nums.forEach((n) => s.add(n));
      total.set(base, s);
    }
  }
  return [...total.entries()].map(([base, s]) => {
    const [type, recueil] = base.split("/") as ["h" | "r", string];
    return { type, recueil, nombre: s.size };
  }).sort((a, b) => b.nombre - a.nombre);
}

export const lienHadith = (r: RefHadith) => (r.type === "h" ? `/hadith/${r.recueil}/ara/${r.numero}` : `/recueil/${r.recueil}/${r.numero}`);

// Motifs d'illustration : d'après les mots du titre français, sinon ceux du thème.
const REGLES: [RegExp, Motif][] = [
  [/pri[eè]re|mosqu|adhān|iqāma|prosterna|qibla|imam/i, "mosquee"], [/pèlerin|ḥajj|ʿumra|kaʿba|mecque|ʿarafa|minā|zamzam/i, "kaaba"],
  [/ablution|lavage|purif|tayammum|ghusl|eau|pluie|mer\b/i, "eau"], [/jeûne|ramadan|croissant|nuit du destin/i, "croissant"],
  [/repas|aliment|nourri|manger|datte|boisson|lait|miel/i, "bol"], [/zakāt|aumône|vente|commerce|prêt|dette|change|usure|location|associ|métayage|marché|salam|gage|cadeau|don\b|dons|biens|monnaie/i, "pieces"],
  [/justice|jug|témoign|peine|talion|sang|testament|héritage|condition|serment|vœu|procuration|litige|injustice|corruption/i, "balance"],
  [/savoir|savant|science|écri|enseign|étudi|apprend/i, "plume"], [/coran|sourate|lecture|verset|révélation|livre|torah|évangile|psaume/i, "livre"],
  [/dhikr|invocation|pardon|louange|rappel/i, "chapelet"], [/mariage|famille|époux|épouse|enfant|orphelin|allait|parents|voisin|maison|femme/i, "maison"],
  [/mort|tombe|linceul|funér|deuil|agonie|défunt/i, "lanterne"], [/heure|signe|dajjāl|épreuve|fin des temps|résurrection|trompe|fumée|gog/i, "sablier"],
  [/soleil|lune/i, "soleil"], [/étoile|ciel|création|ange|trône|djinn|invisible/i, "etoiles"],
  [/médecine|remède|malade|fièvre|ventouse|nigelle|peste|guéri|maladie|œil/i, "feuille"], [/jihād|expédition|combat|butin|cheval|bannière|étendard|armée/i, "etendard"],
  [/paradis/i, "porte"], [/rêve|songe/i, "nuage"], [/voyage|chemin|marche|émigration/i, "chemin"],
  [/prophète|messager|mūsā|ibrāhīm|nūḥ|ʿīsā|yūsuf|sulaymān|dāwūd|ādam/i, "montagne"], [/médine|la mecque|vie du prophète|compagnon/i, "palmier"],
  [/tribu|bédouin|désert/i, "tente"], [/caractère|bonté|douceur|salut|politesse|règles/i, "lanterne"], [/remède|coupe|boire/i, "coupe"],
];
const PAR_THEME: Record<string, Motif[]> = {
  croyance: ["etoiles", "croissant", "livre"], adoration: ["mosquee", "chapelet", "kaaba"], "vie-du-prophete": ["palmier", "mosquee", "chemin"],
  relations: ["maison", "tente", "lanterne"], comportements: ["lanterne", "porte", "chapelet"], "fin-des-temps": ["sablier", "soleil", "etoiles"],
  science: ["plume", "livre", "etoiles"], "maladies-et-remedes": ["feuille", "coupe", "eau"], "autres-themes": ["balance", "livre", "pieces"],
};
export function motifsDe(titre: string, theme: string): Motif[] {
  const trouves = REGLES.filter(([re]) => re.test(titre)).map(([, m]) => m);
  return [...new Set([...trouves, ...(PAR_THEME[theme] ?? ["croissant", "lanterne", "etoiles"])])].slice(0, 3);
}
