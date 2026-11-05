import { describe, expect, it } from "vitest";
import { chapitreKg, chapitresDuThemeKg, hadithsDuSous, motifsDe, repartitionParRecueil, titreKg, tousLesChapitresKg } from "@/donnees/chapitres-kg";
import { themes } from "@/donnees/themes";

describe("chapitres tirés de l'index hadith-kg", () => {
  it("chaque thème du site a des chapitres, chacun avec un titre français", () => {
    for (const t of themes) expect(chapitresDuThemeKg(t.id).length).toBeGreaterThan(0);
    for (const c of tousLesChapitresKg()) {
      expect(c.fr).toBeTruthy();
      for (const s of c.sous) expect(s.fr).toBeTruthy();
    }
  });
  it("les 5 chapitres « Fin des temps » de la maquette viennent en premier", () => {
    expect(chapitresDuThemeKg("fin-des-temps").slice(0, 5).map((c) => c.id)).toEqual(["signes-mineurs", "signes-majeurs", "venue-de-dajjal", "descente-de-issa", "fin-du-monde"]);
  });
  it("aucun chapitre de hadiths forgés (موضوع)", () => {
    expect(tousLesChapitresKg().some((c) => c.ar.includes("موضوع"))).toBe(false);
  });
  it("titre selon la chaîne de repli des langues (fr → français, ar et ur → arabe)", () => {
    const c = chapitreKg("c31219")!;
    expect(titreKg(c, "fr").texte).toBe("La prière");
    expect(titreKg(c, "ar").texte).toBe("الصلاة");
    expect(titreKg(c, "ur").langue).toBe("ar");
  });
  it("les hadiths d'un sous-chapitre pointent vers de vraies pages du site", async () => {
    const c = chapitreKg("c53720")!;
    const refs = await hadithsDuSous(c.id, c.sous[0]!.id);
    expect(refs.length).toBe(c.sous[0]!.nombre);
    expect(refs.every((r) => (r.type === "h" || r.type === "r") && Number.isSafeInteger(r.numero))).toBe(true);
    expect((await repartitionParRecueil(c.id)).length).toBeGreaterThan(0);
  });
  it("motifs d'illustration d'après le sujet", () => {
    expect(motifsDe("La prière", "adoration")[0]).toBe("mosquee");
    expect(motifsDe("La médecine et les remèdes", "maladies-et-remedes")).toContain("feuille");
    expect(motifsDe("Sans mot connu", "croyance").length).toBe(3);
  });
});
