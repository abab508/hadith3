import { describe, expect, it } from "vitest";
import { categorieDepuisRang, chaineKg } from "@/donnees/fiches-kg";

describe("fiches hadith-kg", () => {
  it("Bukhari 1 : chaîne de ʿUmar jusqu'à al-Bukhārī, avec jugements", async () => {
    const c = await chaineKg("bukhari", 1);
    expect(c).not.toBeNull();
    expect(c!.length).toBeGreaterThanOrEqual(6);
    expect(c!.at(-1)!.auteur).toBe(true);
    expect(c!.some((m) => m.jugements.length > 0)).toBe(true);
  });
  it("hadith non relié ou clé invalide : pas de chaîne", async () => {
    expect(await chaineKg("bukhari", 999999)).toBeNull();
    expect(await chaineKg("../x", 1)).toBeNull();
  });
  it("catégorie déduite du rang de la source", () => {
    expect(categorieDepuisRang({ rang: "صحابي", auteur: false })).toBe("compagnon");
    expect(categorieDepuisRang({ rang: "ثقة ثبت", auteur: false })).toBe("thiqa");
    expect(categorieDepuisRang({ rang: "صدوق يخطئ", auteur: false })).toBe("saduq");
    expect(categorieDepuisRang({ rang: "ضعيف", auteur: false })).toBe("daif");
    expect(categorieDepuisRang({ rang: "ثقة", auteur: true })).toBe("compilateur");
    expect(categorieDepuisRang({ auteur: false })).toBe("non-evalue");
  });
});
