import { describe, expect, it } from "vitest";
import fr from "../../messages/fr.json";
import { clesMention, provenance, type Provenance } from "@/donnees/provenance";

const traduction = (origine: "publiee" | "validee" | "ia" | "ia-relue") => ({ langue: "fr", texte: "…", origine, source: origine === "ia" ? null : "Éditeur" });

describe("provenance des traductions (exigence 03 §9)", () => {
  it("distingue les 5 statuts, dont l'original non traduit", () => {
    for (const origine of ["publiee", "validee", "ia", "ia-relue"] as const) {
      expect(provenance({ traductions: [traduction(origine)] }, "fr").statut).toBe(origine);
    }
    const seul = provenance({ traductions: [traduction("ia")] }, "es");
    expect(seul.statut).toBe("original-non-traduit");
    expect(seul.traduction).toBeUndefined();
  });

  it("donne à chaque statut sa propre mention, sans confondre validée et publiée ni IA et IA relue", () => {
    const mentions = (Object.keys(clesMention) as Provenance[]).map((s) => clesMention[s]);
    expect(new Set(mentions).size).toBe(5);
    expect(fr.recherche.traduction.validee).not.toBe(fr.recherche.traduction.publiee);
    expect(fr.recherche.traduction.iaRelue).not.toBe(fr.recherche.traduction.ia);
    expect(fr.recherche.traduction.originalNonTraduit).toBeTruthy();
  });
});
