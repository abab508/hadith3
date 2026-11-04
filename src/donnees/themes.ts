import brut from "../../data/themes/themes.json" with { type: "json" };
import { z } from "zod";

// Thèmes et chapitres de la maquette : structure seulement, sans chiffre ni contenu inventé.
// Les titres et descriptions sont des libellés d'interface (messages/<tag>.json, espaces themes.liste et chapitres.liste).

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const cleTheme = z.enum(["croyance", "adoration", "prophete", "relations", "comportements", "finDesTemps", "science", "maladies", "autres"]);
export const cleChapitre = z.enum(["signesMineurs", "signesMajeurs", "dajjal", "issa", "finDuMonde"]);
export const icone = z.enum(["livre", "kaaba", "etoile", "famille", "arbre", "comete", "colonnes", "feuille", "lanterne"]);

const fichier = z.strictObject({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  miseAJour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statut: z.enum(["a-fournir", "a-valider", "valide"]),
  source: z.string().min(1),
  themes: z.array(z.strictObject({
    id,
    cle: cleTheme,
    icone,
    // Position de l'étiquette sur la carte illustrée, en % de sa largeur et de sa hauteur.
    carte: z.strictObject({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  })).min(1),
  chapitres: z.array(z.strictObject({ id, cle: cleChapitre, theme: id, image: id })),
});

export type Theme = z.infer<typeof fichier>["themes"][number];
export type Chapitre = z.infer<typeof fichier>["chapitres"][number];
export type Icone = z.infer<typeof icone>;

export function chargerThemes(donnees: unknown) {
  const r = fichier.safeParse(donnees);
  if (!r.success) throw new Error(`Thèmes invalides :\n${r.error.message}`);
  const ids = new Set(r.data.themes.map((t) => t.id));
  const erreurs: string[] = [];
  if (ids.size !== r.data.themes.length) erreurs.push("thème en double");
  if (new Set(r.data.chapitres.map((c) => c.id)).size !== r.data.chapitres.length) erreurs.push("chapitre en double");
  for (const c of r.data.chapitres) if (!ids.has(c.theme)) erreurs.push(`${c.id} : thème inconnu ${c.theme}`);
  if (erreurs.length) throw new Error(`Thèmes incohérents :\n${erreurs.join("\n")}`);
  return r.data;
}

export const donneesThemes = chargerThemes(brut);
export const themes = donneesThemes.themes;
export const chapitres = donneesThemes.chapitres;
export const themeParId = (id: string) => themes.find((t) => t.id === id);
export const chapitreParId = (id: string) => chapitres.find((c) => c.id === id);
export const chapitresDuTheme = (id: string) => chapitres.filter((c) => c.theme === id);
export const imageTheme = (id: string) => (id === "fin-des-temps" ? "/images/maquette/fin-des-temps.jpg" : `/images/maquette/theme-${id}.jpg`);
