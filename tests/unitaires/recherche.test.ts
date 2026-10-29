import { describe, expect, it } from "vitest";
import { chercher, normaliser } from "@/donnees/recherche";

const ids = (requete: string) => chercher(requete).map((h) => h.id);

describe("recherche dans le corpus", () => {
  it("ignore voyelles brèves, accents et variantes de alif", () => {
    expect(normaliser("الْأَعْمَالُ")).toBe("الاعمال");
    expect(normaliser("Ṣaḥīḥ al-Bukhārī")).toBe("sahih al bukhari");
  });

  it("trouve un hadith par son texte arabe, avec ou sans voyelles ni article", () => {
    expect(ids("إنما الأعمال بالنيات")).toEqual(["niyyat"]);
    expect(ids("الإيمان بضع")).toEqual(["bukhari-8"]);
    expect(ids("حب الانصار")).toEqual(["bukhari-16"]);
    // Sans l'article, le mot trouve aussi le transmetteur Yaḥyā ibn Saʿīd al-Anṣārī (hadith des intentions).
    expect(ids("انصار")).toEqual(["niyyat", "bukhari-16"]);
  });

  it("trouve un hadith par sa traduction, sa référence ou un transmetteur", () => {
    expect(ids("intentions")).toEqual(["niyyat"]);
    expect(ids("Bukhari 13")).toEqual(["bukhari-13"]);
    expect(ids("Abu Hurayra")).toEqual(["bukhari-8", "bukhari-13"]);
    expect(ids("عائشة")).toEqual(["bukhari-2"]);
  });

  it("ne confond pas un numéro avec un autre qui le contient", () => {
    expect(ids("Bukhari 1")).toEqual(["niyyat"]);
  });

  it("rend tout le corpus sans requête et rien pour un mot absent", () => {
    expect(ids("")).toHaveLength(6);
    expect(ids("zzzz")).toEqual([]);
  });
});
