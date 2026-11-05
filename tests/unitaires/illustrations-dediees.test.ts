import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { imageChapitre, imageMotif } from "../../src/donnees/illustrations-chapitres";
import { chapitreKg } from "../../src/donnees/chapitres-kg";

describe("illustrations narratives de science", () => {
  it("rattache chaque scène distincte au bon chapitre et à un fichier WebP réel", () => {
    const ids = ["c11954", "c12367", "c12267", "c12188", "c12231", "c12322", "c12185", "c11866", "c11832", "c12308", "c12219", "c12246"];
    const signatures = new Set<string>();
    for (const id of ids) {
      expect(chapitreKg(id)?.theme).toBe("science");
      const chemin = imageChapitre(id, "livre");
      const fichierAttendu = id === "c11832" ? "c11832-v2" : id;
      expect(chemin).toBe(`/images/chapitres-dedies/${fichierAttendu}.webp`);
      const fichier = readFileSync(join(process.cwd(), "public", chemin));
      expect(fichier.toString("ascii", 0, 4)).toBe("RIFF");
      expect(fichier.toString("ascii", 8, 12)).toBe("WEBP");
      signatures.add(fichier.toString("base64"));
    }
    expect(signatures.size).toBe(ids.length);
  });

  it("conserve le décor existant tant qu’une scène dédiée n’est pas prête", () => {
    expect(imageChapitre("c3", "etoiles")).toBe(imageMotif("etoiles"));
  });
});
