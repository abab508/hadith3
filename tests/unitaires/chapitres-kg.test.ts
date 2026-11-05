import { describe, expect, it } from "vitest";
import { chapitreKg, chapitresDuThemeKg, hadithsDuSous, illustrationDe, motifsDe, motifsGalerie, repartitionParRecueil, titreKg, tousLesChapitresKg } from "@/donnees/chapitres-kg";
import { themes } from "@/donnees/themes";

describe("chapitres tirés de l'index hadith-kg", () => {
  it("chaque thème a des chapitres et les titres manquants se replient sur l’arabe source", () => {
    for (const t of themes) expect(chapitresDuThemeKg(t.id).length).toBeGreaterThan(0);
    for (const c of tousLesChapitresKg()) {
      for (const entree of [c, ...c.sous]) {
        expect(entree.ar.trim()).not.toBe("");
        expect(titreKg(entree, "fr")).toEqual(entree.fr ? { texte: entree.fr, langue: "fr" } : { texte: entree.ar, langue: "ar" });
      }
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
    expect(motifsDe("Se faire beau pour recevoir les délégations", "comportements")[0]).not.toBe("eau");
    expect(motifsDe("Couvrir les récipients et fermer les portes", "comportements")[0]).not.toBe("eau");
    expect(motifsDe("Le pardon", "croyance")[0]).toBe("chapelet");
    expect(motifsDe("Le jihād et les expéditions", "adoration")[0]).toBe("etendard");
    expect(motifsDe("الجهاد والغزوات", "adoration")[0]).toBe("etendard");
  });
  it("dans un thème, 5 cartes d’affilée montrent 5 scènes différentes, et une scène ne revient jamais à l’identique parmi 6", () => {
    for (const t of themes) {
      const cartes = chapitresDuThemeKg(t.id).map((c) => illustrationDe(c));
      cartes.forEach((carte, i) => {
        for (let k = 1; k <= 5 && i - k >= 0; k++) {
          const voisine = cartes[i - k]!;
          expect(`${carte.motif}#${carte.variante}`, `${t.id}, carte ${i + 1}`).not.toBe(`${voisine.motif}#${voisine.variante}`);
          if (k <= 4) expect(carte.motif, `${t.id}, cartes ${i - k + 1} et ${i + 1}`).not.toBe(voisine.motif);
        }
      });
    }
    // Le sujet reste prioritaire quand il n'est pas déjà sur les cartes voisines.
    expect(illustrationDe(chapitreKg("c31219")!).motif).toBe("mosquee");
  });
  it("la galerie d'un chapitre commence par l'image de sa carte et montre 3 scènes différentes", () => {
    for (const c of tousLesChapitresKg()) {
      const galerie = motifsGalerie(c);
      expect(galerie[0]).toBe(illustrationDe(c).motif);
      expect(new Set(galerie).size).toBe(3);
    }
  });
});
