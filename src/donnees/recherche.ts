import { corpus, ouvrageParId, transmetteurParId } from "@/donnees/corpus";
import type { Hadith } from "@/donnees/schemas/corpus";

export const modes = [
  "approximative", "exacte", "fragment", "traduction", "translitteration", "reference", "transmetteur", "collection",
] as const;
export type Mode = (typeof modes)[number];

export function estMode(valeur: unknown): valeur is Mode {
  return modes.includes(valeur as Mode);
}

// Forme de comparaison : sans voyelles brèves ni accents, variantes de alif/yāʾ/tāʾ marbūṭa unifiées.
// Elle ne sert qu'à comparer ; le texte affiché reste toujours l'original.
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\p{M}\p{Lm}ـ]/gu, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function mots(texte: string): string[] {
  return normaliser(texte).split(" ").filter(Boolean);
}

// « الاعمال » donne aussi « اعمال » : l'article est facultatif dans la requête.
function avecSansArticle(liste: string[]): string[] {
  return [...new Set(liste.flatMap((m) => (m.startsWith("ال") && m.length > 4 ? [m, m.slice(2)] : [m])))];
}

type Champs = Record<"arabe" | "traductions" | "references" | "transmetteurs" | "translitteres" | "recueils", string[]>;

function champs(hadith: Hadith): Champs {
  const ouvrages = hadith.occurrences.map((o) => ({ o, ouvrage: ouvrageParId(o.ouvrage) }));
  const personnes = [...hadith.chaine.tronc, ...hadith.chaine.voies.flatMap((v) => v.transmetteurs)]
    .flatMap((id) => transmetteurParId(id) ?? []);
  return {
    arabe: [hadith.texteAr, hadith.requeteAr, ...hadith.occurrences.flatMap((o) => o.texteAr ?? [])],
    traductions: hadith.traductions.map((t) => t.texte),
    references: ouvrages.map(({ o, ouvrage }) => `${ouvrage?.nom ?? o.ouvrage} ${o.numero}`),
    transmetteurs: personnes.flatMap((t) => [t.nomAr, t.nomTranslittere]),
    translitteres: personnes.map((t) => t.nomTranslittere),
    recueils: ouvrages.flatMap(({ o, ouvrage }) => [ouvrage?.nom ?? "", ouvrage?.nomAr ?? "", o.livre, o.livreAr]),
  };
}

// Champs consultés par chaque mode de recherche.
const portee: Record<Mode, (keyof Champs)[]> = {
  approximative: ["arabe", "traductions", "references", "transmetteurs", "recueils"],
  exacte: ["arabe", "traductions"],
  fragment: ["arabe", "traductions"],
  traduction: ["traductions"],
  translitteration: ["translitteres", "references", "recueils"],
  reference: ["references"],
  transmetteur: ["transmetteurs"],
  collection: ["recueils"],
};

const champsParHadith = new Map(corpus.hadiths.map((h) => [h.id, champs(h)]));

function correspond(hadith: Hadith, requete: string, mode: Mode): boolean {
  const c = champsParHadith.get(hadith.id);
  if (!c) return false;
  const textes = portee[mode].flatMap((cle) => c[cle]).map(normaliser);
  const demande = normaliser(requete);
  if (mode === "exacte") return textes.some((t) => ` ${t} `.includes(` ${demande} `));
  if (mode === "fragment") return textes.some((t) => t.includes(demande));
  // Chaque mot de la requête doit figurer : mot entier, ou début de mot dès 3 lettres.
  const disponibles = avecSansArticle(textes.flatMap((t) => t.split(" ").filter(Boolean)));
  return mots(requete).every((d) => disponibles.some((m) => m === d || (d.length >= 3 && m.startsWith(d))));
}

// Une requête faite seulement d'un nombre (chiffres latins ou arabes) est un numéro de hadith.
export function numeroDemande(requete: string): string | undefined {
  const chiffres = requete.trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0));
  return /^\d+$/.test(chiffres) ? String(Number(chiffres)) : undefined;
}

// Le numéro se vérifie occurrence par occurrence (recueil par recueil) : voir la page Résultats.
export function chercher(requete: string, mode: Mode = "approximative"): Hadith[] {
  if (mots(requete).length === 0) return corpus.hadiths;
  const numero = numeroDemande(requete);
  if (numero) return corpus.hadiths.filter((h) => h.occurrences.some((o) => o.numero === numero));
  return corpus.hadiths.filter((h) => correspond(h, requete, mode));
}

export function estArabe(texte: string): boolean {
  return /\p{Script=Arabic}/u.test(texte);
}

export type Livre = { valeur: string; nom: string; nomAr: string };
export type Recueil = { id: string; nom: string; nomAr: string; livres: Livre[] };

// Recueils présents dans le corpus, chacun avec ses livres (kutub) connus, dans l'ordre d'apparition.
export function recueilsEtLivres(): Recueil[] {
  const recueils = new Map<string, Recueil>();
  for (const o of corpus.hadiths.flatMap((h) => h.occurrences)) {
    const ouvrage = ouvrageParId(o.ouvrage);
    if (!ouvrage) continue;
    const r = recueils.get(o.ouvrage) ?? { id: o.ouvrage, nom: ouvrage.nom, nomAr: ouvrage.nomAr, livres: [] };
    if (!r.livres.some((l) => l.valeur === o.livre)) r.livres.push({ valeur: o.livre, nom: o.livre, nomAr: o.livreAr });
    recueils.set(o.ouvrage, r);
  }
  return [...recueils.values()];
}
