import { corpus, ouvrageParId, transmetteurParId } from "@/donnees/corpus";
import type { Hadith } from "@/donnees/schemas/corpus";

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

// Tous les mots où chercher pour un hadith ; « الاعمال » donne aussi « اعمال ».
function index(hadith: Hadith): string[] {
  const textes = [
    hadith.texteAr,
    hadith.requeteAr,
    ...hadith.traductions.map((t) => t.texte),
    ...hadith.occurrences.flatMap((o) => {
      const ouvrage = ouvrageParId(o.ouvrage);
      return [o.texteAr ?? "", `${ouvrage?.nom ?? ""} ${o.numero}`, ouvrage?.nomAr ?? ""];
    }),
    ...[...hadith.chaine.tronc, ...hadith.chaine.voies.flatMap((v) => v.transmetteurs)].flatMap((id) => {
      const t = transmetteurParId(id);
      return t ? [t.nomAr, t.nomTranslittere] : [];
    }),
  ];
  return [...new Set(textes.flatMap(mots).flatMap((m) => (m.startsWith("ال") && m.length > 4 ? [m, m.slice(2)] : [m])))];
}

const indexParHadith = new Map(corpus.hadiths.map((h) => [h.id, index(h)]));

// Un hadith correspond si chaque mot de la requête y figure (mot entier, ou début de mot dès 3 lettres).
export function chercher(requete: string): Hadith[] {
  const demandes = mots(requete);
  if (demandes.length === 0) return corpus.hadiths;
  return corpus.hadiths.filter((h) => {
    const disponibles = indexParHadith.get(h.id) ?? [];
    return demandes.every((d) => disponibles.some((m) => m === d || (d.length >= 3 && m.startsWith(d))));
  });
}

export function estArabe(texte: string): boolean {
  return /\p{Script=Arabic}/u.test(texte);
}
