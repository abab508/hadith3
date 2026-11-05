import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { imageChapitre, imageMotif } from "../../src/donnees/illustrations-chapitres";
import { chapitresDuThemeKg } from "../../src/donnees/chapitres-kg";

describe("illustrations narratives de science", () => {
  it("rattache chaque scène distincte au bon chapitre et à un fichier WebP réel", () => {
    const ids = chapitresDuThemeKg("science").map((chapitre) => chapitre.id);
    expect(ids.length).toBeGreaterThan(12);
    const signatures = new Set<string>();
    for (const id of ids) {
      const chemin = imageChapitre(id, "livre");
      const fichierAttendu = id === "c11832" ? "c11832-v2" : id;
      expect(chemin).toBe(`/images/chapitres-dedies/${fichierAttendu}.webp`);
      const fichier = readFileSync(join(process.cwd(), "public", chemin));
      expect(fichier.toString("ascii", 0, 4)).toBe("RIFF");
      expect(fichier.toString("ascii", 8, 12)).toBe("WEBP");
      signatures.add(createHash("sha256").update(fichier).digest("hex"));
    }
    expect(signatures.size).toBe(ids.length);
  });

  it("conserve le décor existant tant qu’une scène dédiée n’est pas prête", () => {
    expect(imageChapitre("c3", "etoiles")).toBe(imageMotif("etoiles"));
  });
});
