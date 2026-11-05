import brut from "../../data/termes/jugements-critiques.json" with { type: "json" };

// Traduction des jugements des critiques (jarḥ wa taʿdīl) dans la langue choisie.
// Dictionnaire de termes et de formules (traduction IA à relire) : un jugement n'est traduit que si
// TOUS ses mots sont reconnus ; sinon on renvoie null et seul l'arabe de la source est affiché.
// L'arabe reste toujours la référence et s'affiche à côté.

type Langue = "fr" | "en" | "es" | "id" | "ms" | "tr" | "ur";
const LANGUES = new Set<string>(["fr", "en", "es", "id", "ms", "tr", "ur"]);

export const normaliserJugement = (s: string) =>
  s.normalize("NFC").replace(/[ً-ْٰـ()]/gu, "").replace(/[،,.]/gu, " ، ").replace(/\s+/gu, " ").trim();

const termes = new Map<string, Record<Langue, string>>(
  Object.entries((brut as { termes: Record<string, Record<Langue, string>> }).termes).map(([ar, t]) => [normaliserJugement(ar), t]),
);
const MAX = Math.max(...[...termes.keys()].map((k) => k.split(" ").length));

export function traduireJugement(texte: string | undefined, langue: string): string | null {
  if (!texte || !LANGUES.has(langue)) return null;
  const mots = normaliserJugement(texte).split(" ").filter(Boolean);
  const morceaux: string[] = [];
  for (let i = 0; i < mots.length;) {
    if (mots[i] === "،") { i++; continue; }
    let trouve = false;
    for (let n = Math.min(MAX, mots.length - i); n > 0; n--) {
      const t = termes.get(mots.slice(i, i + n).join(" "));
      if (t) { morceaux.push(t[langue as Langue]); i += n; trouve = true; break; }
    }
    if (!trouve) return null;
  }
  if (!morceaux.length) return null;
  // Une formule qui annonce une citation (« dans al-Taqrīb : ») est suivie d'un espace, pas d'une virgule.
  return morceaux.reduce((acc, m) => (acc ? (/[:：]$/u.test(acc) ? `${acc} ${m}` : `${acc}, ${m}`) : m), "");
}
