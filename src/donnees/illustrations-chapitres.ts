// Scènes décoratives choisies d’après les sujets du catalogue, sans modifier les textes sources.
export const motifsIllustrations = [
  "livre", "croissant", "mosquee", "lanterne", "kaaba", "eau", "palmier", "balance", "plume", "chapelet",
  "pieces", "maison", "sablier", "etoiles", "feuille", "coupe", "etendard", "porte", "montagne", "soleil",
  "nuage", "bol", "tente", "chemin",
] as const;
export type Motif = typeof motifsIllustrations[number];
export const imageMotif = (motif: Motif) => `/images/chapitres/${motif}.png`;
