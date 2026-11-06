import brut from "../../data/videos/videos.json" with { type: "json" };
import { catalogue } from "@/donnees/catalogue";
import { catalogueVideos, type Video } from "@/donnees/schemas/video";

export function chargerVideos(donnees: unknown, tagsConnus: string[]): Video[] {
  const resultat = catalogueVideos.safeParse(donnees);
  if (!resultat.success) {
    throw new Error(`Liste des vidéos invalide :\n${resultat.error.message}`);
  }
  for (const v of resultat.data.videos) {
    const inconnus = [v.voix, v.sousTitres].filter((tag) => !tagsConnus.includes(tag));
    if (inconnus.length > 0) {
      throw new Error(`Vidéo ${v.id} : langues hors catalogue (${inconnus.join(", ")})`);
    }
  }
  return resultat.data.videos;
}

export const videos = chargerVideos(brut, catalogue.entrees.map((e) => e.tag));

// Vidéo rattachée à une fiche biographique, s'il y en a une.
export function videoDe(personne: number): Video | undefined {
  return videos.find((v) => v.personne === personne);
}
