import { describe, expect, it } from "vitest";
import brut from "../../data/themes/themes.json";
import fr from "../../messages/fr.json";
import { chargerThemes, chapitres, chapitresDuTheme, themes } from "@/donnees/themes";
import { clesChapitres, clesThemes } from "@/donnees/cles-themes";
import { alphabetArabe, alphabetLatin, lettreIndex, sansArticle } from "@/donnees/index-az";

describe("thèmes et chapitres de la maquette", () => {
  it("contient les 9 thèmes et les 5 chapitres de la fin des temps", () => {
    expect(themes).toHaveLength(9);
    expect(chapitresDuTheme("fin-des-temps")).toHaveLength(5);
    expect(chapitres.every((c) => c.theme === "fin-des-temps")).toBe(true);
  });

  it("a un titre traduit pour chaque thème et chaque chapitre", () => {
    for (const t of themes) expect(fr.themes.liste[t.cle].titre).toBeTruthy();
    for (const c of chapitres) expect(fr.chapitres.liste[c.cle].titre).toBeTruthy();
    expect(Object.keys(clesThemes)).toHaveLength(9);
    expect(Object.keys(clesChapitres)).toHaveLength(5);
  });

  it("n'affiche aucun chiffre inventé dans les titres et descriptions", () => {
    for (const t of Object.values(fr.themes.liste)) expect(`${t.titre} ${t.description}`).not.toMatch(/\d/);
  });

  it("refuse un chapitre rattaché à un thème inconnu", () => {
    const faux = structuredClone(brut);
    faux.chapitres[0] = { ...faux.chapitres[0]!, theme: "inconnu" };
    expect(() => chargerThemes(faux)).toThrow(/thème inconnu/);
  });
});

describe("index A-Z", () => {
  it("ignore les articles et les accents", () => {
    expect(lettreIndex("Al-Muwatta de Malik", alphabetLatin)).toBe("M");
    expect(lettreIndex("La croyance", alphabetLatin)).toBe("C");
    expect(lettreIndex("L’adoration", alphabetLatin)).toBe("A");
    expect(lettreIndex("Ṣaḥīḥ Muslim", alphabetLatin)).toBe("S");
    expect(sansArticle("As-Sahifa as-Sadiqa")).toBe("Sahifa as-Sadiqa");
  });

  it("indexe les titres arabes sans l'article ال", () => {
    expect(lettreIndex("الأدب المفرد", alphabetArabe)).toBe("ا");
    expect(lettreIndex("صحيح البخاري", alphabetArabe)).toBe("ص");
  });
});
