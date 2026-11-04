import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { chapitres, imageTheme, themes } from "@/donnees/themes";

// Lire les dimensions des JPEG d'origine sans ajouter une bibliothèque au projet.
function dimensionsJpeg(image: Buffer) {
  if (image.readUInt16BE(0) !== 0xffd8) throw new Error("Source non JPEG");
  const marqueursDimensions = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let position = 2;
  while (position + 4 < image.length) {
    if (image[position] !== 0xff) throw new Error("Marqueur JPEG invalide");
    while (image[position] === 0xff) position++;
    const marqueur = image[position++]!;
    if (marqueur === 0xda || marqueur === 0xd9) break;
    const longueur = image.readUInt16BE(position);
    if (marqueursDimensions.has(marqueur)) {
      return { largeur: image.readUInt16BE(position + 5), hauteur: image.readUInt16BE(position + 3) };
    }
    if (longueur < 2) throw new Error("Segment JPEG invalide");
    position += longueur;
  }
  throw new Error("Dimensions JPEG introuvables");
}

describe("décors haute définition", () => {
  it("garde les panoramas et les chapitres associés aux mêmes scènes", () => {
    expect(imageTheme("fin-des-temps")).toBe("/images/hd/fin-des-temps.png");
    for (const theme of themes) {
      const scene = theme.id === "fin-des-temps" ? "fin-des-temps" : `theme-${theme.id}`;
      expect(imageTheme(theme.id)).toBe(`/images/hd/${scene}.png`);
    }
    for (const [index, chapitre] of chapitres.entries()) expect(chapitre.image).toBe(`chapitre-${index + 1}`);
  });

  it("conserve les vingt JPEG et fournit pour chacun un vrai PNG haute définition", () => {
    const originaux = fileURLToPath(new URL("../../public/images/maquette/", import.meta.url));
    const fichiers = readdirSync(originaux).filter((nom) => nom.endsWith(".jpg"));
    expect(fichiers).toHaveLength(20);
    for (const fichier of fichiers) {
      const source = dimensionsJpeg(readFileSync(new URL(`../../public/images/maquette/${fichier}`, import.meta.url)));
      const hd = readFileSync(new URL(`../../public/images/hd/${fichier.replace(/\.jpg$/, ".png")}`, import.meta.url));
      expect(hd.subarray(0, 8).toString("hex"), fichier).toBe("89504e470d0a1a0a");
      // Les rendus HD restent distincts d'une garantie de création native en 4K.
      expect(hd.readUInt32BE(16), fichier).toBeGreaterThan(source.largeur);
      expect(hd.readUInt32BE(20), fichier).toBeGreaterThan(source.hauteur);
    }
  });
});
