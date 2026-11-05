import { describe, expect, it } from "vitest";
import brut from "../../data/recueils/catalogue-recueils.json";
import { catalogueRecueils, chargerRecueils, rayons } from "@/donnees/recueils";

describe("catalogue des recueils de hadiths", () => {
  it("contient les 68 recueils sunnites de la liste du patron, numérotés dans l'ordre", () => {
    expect(catalogueRecueils.recueils).toHaveLength(68);
    catalogueRecueils.recueils.forEach((r, i) => expect(r.numero).toBe(i + 1));
  });

  it("garde chaque nom arabe en Unicode NFC", () => {
    for (const r of catalogueRecueils.recueils) expect(r.nomAr).toBe(r.nomAr.normalize("NFC"));
  });

  it("ne garde que des rayons sunnites (imamite et ibadite retirés à la demande du patron)", () => {
    expect(catalogueRecueils.familles).not.toContain("imamite");
    expect(catalogueRecueils.familles).not.toContain("ibadite");
  });

  it("répartit tous les recueils dans les rayons", () => {
    const total = rayons().reduce((s, r) => s + r.recueils.length, 0);
    expect(total).toBe(68);
    expect(rayons().find((r) => r.famille === "neuf")?.recueils.every((l) => l.cherchable)).toBe(true);
  });

  it("donne à chaque livre une vraie page du site, ou aucune (jamais la Recherche)", () => {
    const livres = rayons().flatMap((r) => r.recueils);
    for (const l of livres) {
      if (l.lisible > 0) expect(l.page).toEqual({ href: `/recueil/${l.id}`, type: "recueil" });
      else if (l.page) expect(l.page.href).toBe(`/hadith/${l.id}/ara/1`);
    }
    expect(livres.find((l) => l.id === "sahih-bukhari")?.page?.type).toBe("premier");
    expect(livres.find((l) => l.id === "jami-al-usul")?.page).toBeNull();
    expect(livres.filter((l) => l.page).length).toBe(49);
  });

  it("refuse un doublon ou une numérotation cassée", () => {
    const double = structuredClone(brut);
    double.recueils[1] = { ...double.recueils[0]!, numero: 2 };
    expect(() => chargerRecueils(double)).toThrow(/double/);
    const trou = structuredClone(brut);
    trou.recueils[0] = { ...trou.recueils[0]!, numero: 5 };
    expect(() => chargerRecueils(trou)).toThrow(/numéro/);
  });
});
