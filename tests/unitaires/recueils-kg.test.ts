import { describe, expect, it } from "vitest";
import { blocDe, extrait, nombreBlocs, recueilsKg, validerRecueil } from "@/donnees/recueils-kg";
import { catalogueRecueils } from "@/donnees/recueils";

describe("recueils de la bibliothèque (hadith-kg)", () => {
  it("chaque recueil de l'index existe dans le catalogue", () => {
    const ids = new Set(catalogueRecueils.recueils.map((r) => r.id));
    expect(recueilsKg.size).toBeGreaterThanOrEqual(40);
    for (const id of recueilsKg.keys()) expect(ids.has(id)).toBe(true);
  });
  it("numéros acceptés seulement dans les bornes du recueil", () => {
    const ahmad = recueilsKg.get("musnad-ahmad")!;
    expect(validerRecueil("musnad-ahmad", "1")?.n).toBe(1);
    expect(validerRecueil("musnad-ahmad", String(ahmad.nombre + 1))).toBeNull();
    expect(validerRecueil("musnad-ahmad", "0")).toBeNull();
    expect(validerRecueil("musnad-ahmad", "1e3")).toBeNull();
    expect(validerRecueil("../x")).toBeNull();
  });
  it("blocs de 100 hadiths", () => {
    expect(blocDe(1)).toBe(1);
    expect(blocDe(100)).toBe(1);
    expect(blocDe(101)).toBe(2);
    expect(nombreBlocs({ id: "x", livres: [], nombre: 250, avecChaine: 0, bloc: 100 })).toBe(3);
  });
  it("extrait sans voyelles brèves, coupé sur un mot", () => {
    expect(extrait("حَدَّثَنَا مُحَمَّدٌ")).toBe("حدثنا محمد");
    const e = extrait("كلمة ".repeat(80), 30);
    expect(e.endsWith("…")).toBe(true);
    expect(e.length).toBeLessThanOrEqual(31);
  });
});
