import { z } from "zod";

// Courtes vidéos rattachées à une fiche biographique (data/videos/videos.json).
// Le fichier et son affiche sont servis par le site (public/videos/).

const texte = z.string().min(1).refine((s) => s === s.normalize("NFC"), "texte non NFC");
const fichierPublic = (extension: string) =>
  z.string().regex(new RegExp(`^/videos/[a-z0-9]+(-[a-z0-9]+)*\\.${extension}$`), `chemin /videos/<nom>.${extension} attendu`);

export const video = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  // Numéro de la fiche biographique (data/biographies/fiches).
  personne: z.number().int().positive(),
  fichier: fichierPublic("mp4"),
  affiche: fichierPublic("jpg"),
  largeur: z.number().int().positive(),
  hauteur: z.number().int().positive(),
  duree: z.number().positive(),
  // Langue de la voix off et des sous-titres incrustés (tags du catalogue des langues).
  voix: z.string().min(2),
  sousTitres: z.string().min(2),
  // Texte de la voix off, phrase par phrase, avec le sous-titre affiché à l'écran.
  texte: z.array(z.strictObject({ ar: texte.regex(/[؀-ۿ]/, "aucune lettre arabe"), sousTitre: texte })).min(1),
});

export const catalogueVideos = z
  .strictObject({ version: z.literal(1), videos: z.array(video) })
  .refine((c) => new Set(c.videos.map((v) => v.personne)).size === c.videos.length, "une seule vidéo par fiche")
  .refine((c) => new Set(c.videos.map((v) => v.id)).size === c.videos.length, "identifiants de vidéo en double");

export type Video = z.infer<typeof video>;
