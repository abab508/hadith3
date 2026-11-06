import { describe, expect, it } from "vitest";
import { statSync } from "node:fs";
import { aUneFiche, ficheBio } from "@/donnees/biographies";
import { chargerVideos, videoDe, videos } from "@/donnees/videos";

const publicFichier = (chemin: string) => new URL(`../../public${chemin}`, import.meta.url);
const exemple = {
  id: "essai", personne: 4945, fichier: "/videos/essai.mp4", affiche: "/videos/essai.jpg",
  largeur: 720, hauteur: 1280, duree: 60, voix: "ar", sousTitres: "fr",
  texte: [{ ar: "نص", sousTitre: "Texte" }],
};

describe("vidéos des fiches biographiques", () => {
  it("rattachent chaque vidéo à une fiche existante, avec son fichier et son affiche", async () => {
    expect(videos.length).toBeGreaterThan(0);
    for (const v of videos) {
      expect(aUneFiche(v.personne), v.id).toBe(true);
      expect(await ficheBio(v.personne), v.id).not.toBeNull();
      // Fichier léger pour le site (le rendu original de 36 Mo reste hors du dépôt).
      expect(statSync(publicFichier(v.fichier)).size, v.fichier).toBeLessThan(15 * 1024 * 1024);
      expect(statSync(publicFichier(v.affiche)).size, v.affiche).toBeGreaterThan(0);
    }
  });

  it("donnent la vidéo d'Abū Bakr as-Ṣiddīq avec le texte de sa voix off", () => {
    const v = videoDe(4945);
    expect(v?.voix).toBe("ar");
    expect(v?.sousTitres).toBe("fr");
    expect(v?.texte[0]?.ar).toContain("أبو بكرٍ الصِّدِّيق");
    expect(v?.texte.length).toBe(8);
    expect(videoDe(4396)).toBeUndefined();
  });

  it("refusent une langue hors catalogue, un chemin hors de /videos/ et deux vidéos pour une fiche", () => {
    const tags = ["ar", "fr"];
    expect(chargerVideos({ version: 1, videos: [exemple] }, tags)).toHaveLength(1);
    expect(() => chargerVideos({ version: 1, videos: [{ ...exemple, sousTitres: "xx" }] }, tags)).toThrow(/hors catalogue/);
    expect(() => chargerVideos({ version: 1, videos: [{ ...exemple, fichier: "https://exemple.test/v.mp4" }] }, tags)).toThrow();
    expect(() => chargerVideos({ version: 1, videos: [exemple, { ...exemple, id: "autre" }] }, tags)).toThrow(/une seule vidéo/);
  });
});
