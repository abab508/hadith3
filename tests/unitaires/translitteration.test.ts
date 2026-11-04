import { describe, expect, it } from "vitest";
import { avecLatin, ecritLatin, translitererLieux, translitererNom } from "@/donnees/translitteration";

describe("translittération des fiches", () => {
  it("écrit un nom connu en lettres latines", () => {
    expect(translitererNom("أنس بن مالك بن النضر")).toBe("Anas ibn Mālik ibn al-Naḍr");
    expect(translitererNom("الأنصاري،النجاري،الخزرجي")).toBe("al-Anṣārī, al-Najjārī, al-Khazrajī");
  });
  it("écrit les lieux connus", () => {
    expect(translitererLieux("البصرة")).toBe("al-Baṣra");
    expect(translitererLieux("قيسارية ، مكة")).toBe("Qaysāriyya, Makka");
  });
  it("ne devine rien : un mot inconnu laisse le champ en arabe seulement", () => {
    expect(translitererNom("أنس بن زقزقطوط")).toBeUndefined();
    expect(translitererLieux("مدينة خيالية")).toBeUndefined();
  });
  it("seulement pour les langues écrites en lettres latines (catalogue des langues)", () => {
    expect(ecritLatin("fr")).toBe(true);
    expect(ecritLatin("ar")).toBe(false);
    expect(ecritLatin("ur")).toBe(false);
    const m = { id: "1", nom: "أنس بن مالك", jugements: [], auteur: false };
    expect(avecLatin([m], "fr")[0]!.latin?.nom).toBe("Anas ibn Mālik");
    expect(avecLatin([m], "ar")[0]!.latin).toBeUndefined();
  });
});
