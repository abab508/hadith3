// Scènes décoratives choisies d’après les sujets du catalogue, sans modifier les textes sources.
export const motifsIllustrations = [
  "livre", "croissant", "mosquee", "lanterne", "kaaba", "eau", "palmier", "balance", "plume", "chapelet",
  "pieces", "maison", "sablier", "etoiles", "feuille", "coupe", "etendard", "porte", "montagne", "soleil",
  "nuage", "bol", "tente", "chemin",
] as const;
export type Motif = typeof motifsIllustrations[number];
export const imageMotif = (motif: Motif) => `/images/chapitres/${motif}.png`;

// Scènes propres au chapitre, générées et contrôlées individuellement.
const chapitresIllustres = new Set<string>(["c11832", "c11866", "c11954", "c12185", "c12188", "c12219", "c12231", "c12246", "c12267", "c12308", "c12322", "c12367"]);
export const possedeImageChapitre = (id: string) => chapitresIllustres.has(id);
export const imageChapitre = (id: string, motif: Motif) => possedeImageChapitre(id) ? `/images/chapitres-dedies/${id === "c11832" ? "c11832-v2" : id}.webp` : imageMotif(motif);
