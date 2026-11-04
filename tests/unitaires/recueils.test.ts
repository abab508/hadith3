import { describe, expect, it } from "vitest";
import brut from "../../data/recueils/catalogue-recueils.json";
import { catalogueRecueils, chargerRecueils, rayons } from "@/donnees/recueils";

describe("catalogue des recueils de hadiths", () => {
  it("contient les 92 recueils de la liste du patron, numérotés dans l'ordre", () => {
    expect(catalogueRecueils.recueils).toHaveLength(92);
    catalogueRecueils.recueils.forEach((r, i) => expect(r.numero).toBe(i + 1));
  });

  it("garde chaque nom arabe en Unicode NFC", () => {
    for (const r of catalogueRecueils.recueils) expect(r.nomAr).toBe(r.nomAr.normalize("NFC"));
  });

  it("n'invente aucun auteur pour les rayons imamite et ibadite", () => {
    const sansAuteur = catalogueRecueils.recueils.filter((r) => r.famille === "imamite" || r.famille === "ibadite");
    expect(sansAuteur).toHaveLength(24);
    for (const r of sansAuteur) expect(r.auteur).toBeUndefined();
  });

  it("répartit tous les recueils dans les rayons", () => {
    const total = rayons().reduce((s, r) => s + r.recueils.length, 0);
    expect(total).toBe(92);
    expect(rayons().find((r) => r.famille === "neuf")?.recueils.every((l) => l.cherchable)).toBe(true);
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
