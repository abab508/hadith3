// Index alphabétique : lettre d'entrée d'un titre, sans article ni accent.
// Alphabets d'écriture (pas une liste de langues) : latin A-Z, ou arabe pour les interfaces en écriture arabe.

export const alphabetLatin = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
export const alphabetArabe = [..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"];

// Articles retirés en tête de titre : translittération arabe (al-, an-, as-…), français, anglais, espagnol, arabe (ال).
const articles = /^(?:(?:a[lnstdrz]|ash|adh|ath|el)-|l[’']|(?:le|la|les|the|el|los|las|une?|des?)\s+)/iu;

// Titre sans ponctuation de tête ni article : sert à la lettre d'index et au tri.
export function sansArticle(titre: string): string {
  return titre.trim().replace(/^[\d\s.()«»"“”‘’ʿʾ‘-]+/u, "").replace(articles, "");
}

export function lettreIndex(titre: string, alphabet: readonly string[]): string | null {
  let t = sansArticle(titre);
  if (alphabet === alphabetArabe) {
    t = t.replace(/^ال/u, "").replace(/^[أإآ]/u, "ا");
    const c = t.charAt(0);
    return alphabet.includes(c) ? c : null;
  }
  const c = t.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
  return alphabet.includes(c) ? c : null;
}

export type EntreeIndex = { titre: string; tri: string; type: "theme" | "chapitre" | "recueil"; href: string; lettre: string };
