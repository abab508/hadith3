import { describe, expect, it } from "vitest";
import { PROPHETES, aUneFiche, chapitresDesProphetes, critiques, ficheBio, filtrer, personnesDe, serieDe } from "@/donnees/biographies";

describe("biographies (hadith-kg)", () => {
  it("garde les séries et leurs seuils de la source", () => {
    expect(personnesDe("compagnons").length).toBe(560);
    expect(personnesDe("successeurs").length).toBe(706);
    expect(personnesDe("atba").length).toBe(845);
    expect(personnesDe("compagnons").every(([, , , , n]) => n >= 5)).toBe(true);
    expect(critiques().every(([, , , , , n]) => n >= 50)).toBe(true);
  });

  it("donne la fiche d'Abū Hurayra avec ses maîtres et élèves tirés des chaînes", async () => {
    const f = await ficheBio(4396);
    expect(f?.kunya).toBe("أبو هريرة الدوسي");
    expect(f?.deces).toBe("57");
    expect(f?.maitres[0]?.[1]).toBe("عمر بن الخطاب العدوي");
    expect(f?.eleves.length).toBeGreaterThan(0);
    expect(serieDe(4396)).toBe("compagnons");
  });

  it("relie les auteurs à leurs recueils et refuse une fiche inconnue", async () => {
    expect((await ficheBio(6817))?.recueils).toContain("sahih-bukhari");
    expect(serieDe(6817)).toBe("savants");
    expect(aUneFiche(999999)).toBe(false);
    expect(await ficheBio(999999)).toBeNull();
  });

  it("cherche un nom sans tenir compte des voyelles", () => {
    expect(filtrer(personnesDe("compagnons"), "أبو هريرة").map(([id]) => id)).toContain(4396);
  });

  it("trouve des chapitres pour les prophètes sans prendre les kunyas ni les sourates", () => {
    const parProphete = chapitresDesProphetes();
    expect(PROPHETES.length).toBe(21);
    expect(parProphete.get("musa")!.length).toBeGreaterThan(5);
    for (const liste of parProphete.values()) {
      for (const c of liste) expect(c.titre.ar).not.toMatch(/(?:أبو|أبي|سورة) موسى/);
    }
  });
});
