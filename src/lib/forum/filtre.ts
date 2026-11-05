/**
 * Filtre des mots interdits du forum (liste tenue par l'administrateur).
 * Comparaison tolérante : minuscules, sans accents latins, sans voyelles brèves arabes ni tatwīl,
 * formes de l'alif unifiées, lettres répétées réduites à une seule (« idiooot » = « idiot »), des deux côtés de la comparaison.
 */
export function normaliserTexte(texte: string): string {
  return texte
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/(\p{L})\1+/gu, "$1");
}

// Découpe en mots (lettres et chiffres de toutes écritures).
const mots = (t: string) => normaliserTexte(t).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// Mots ou expressions de la liste présents dans le texte (expression = suite de mots consécutifs).
export function motsTrouves(texte: string, liste: string[]): string[] {
  const suite = mots(texte);
  const trouves: string[] = [];
  for (const entree of liste) {
    const cible = mots(entree);
    if (cible.length === 0) continue;
    for (let i = 0; i + cible.length <= suite.length; i++) {
      if (cible.every((m, k) => suite[i + k] === m)) { trouves.push(entree); break; }
    }
  }
  return trouves;
}
