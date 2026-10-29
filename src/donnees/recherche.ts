import { corpus, ouvrageParId, transmetteurParId } from "@/donnees/corpus";
import type { Hadith, Ouvrage as OuvrageCorpus, Transmetteur } from "@/donnees/schemas/corpus";

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

export type Ouvrage = { id: string; nom: string; nomAr: string };
export type Categorie = { categorie: Exclude<OuvrageCorpus["categorie"], "hadith">; livres: Ouvrage[] };

const resume = (o: OuvrageCorpus): Ouvrage => ({ id: o.id, nom: o.nom, nomAr: o.nomAr });
const tousLesOuvrages = () => corpus.bibliotheques.flatMap((b) => b.ouvrages);

// Recueils de hadith présents dans le corpus, dans l'ordre d'apparition.
export function recueils(): Ouvrage[] {
  const ids = [...new Set(corpus.hadiths.flatMap((h) => h.occurrences.map((o) => o.ouvrage)))];
  return ids.flatMap((id) => {
    const o = ouvrageParId(id);
    return o && o.categorie === "hadith" ? [resume(o)] : [];
  });
}

// Livres des autres catégories (pas les recueils de hadith), groupés par catégorie.
export function livresParCategorie(): Categorie[] {
  const groupes = new Map<Categorie["categorie"], Ouvrage[]>();
  for (const o of tousLesOuvrages()) {
    if (o.categorie === "hadith") continue;
    groupes.set(o.categorie, [...(groupes.get(o.categorie) ?? []), resume(o)]);
  }
  return [...groupes].map(([categorie, livres]) => ({ categorie, livres }));
}

export function estLivreAutreCategorie(id: string | undefined): boolean {
  return tousLesOuvrages().some((o) => o.id === id && o.categorie !== "hadith");
}

// Transmetteurs cités dans un livre : par nom (arabe ou translittéré) ou par numéro de notice.
export function chercherDansLivre(livre: string, requete: string): { transmetteur: Transmetteur; reference: string }[] {
  const numero = numeroDemande(requete);
  const demandes = mots(requete);
  return corpus.transmetteurs.flatMap((transmetteur) => {
    const source = transmetteur.sources.find((s) => s.ouvrage === livre);
    if (!source) return [];
    // « n° 2451 (…) » : le numéro de notice est un mot de la référence.
    if (numero) return mots(source.reference).includes(numero) ? [{ transmetteur, reference: source.reference }] : [];
    const disponibles = avecSansArticle(mots(`${transmetteur.nomAr} ${transmetteur.nomTranslittere}`));
    const trouve = demandes.every((d) => disponibles.some((m) => m === d || (d.length >= 3 && m.startsWith(d))));
    return trouve ? [{ transmetteur, reference: source.reference }] : [];
  });
}

// Hadiths du corpus dont la chaîne passe par ce transmetteur.
export function hadithsDuTransmetteur(id: string): Hadith[] {
  return corpus.hadiths.filter((h) => [...h.chaine.tronc, ...h.chaine.voies.flatMap((v) => v.transmetteurs)].includes(id));
}
