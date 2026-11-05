import { describe, expect, it } from "vitest";
import { traduireJugement } from "@/donnees/jugements-traduits";

describe("jugements des critiques traduits dans la langue choisie", () => {
  it("traduit les jugements courts dans chaque langue", () => {
    expect(traduireJugement("ثقة متقن حافظ إمام قدوة", "fr")).toBe("fiable et rigoureux, mémorisateur, imam, modèle");
    expect(traduireJugement("ثقة حافظ", "en")).toBe("reliable, a memorizer");
    expect(traduireJugement("صدوق حسن الحديث", "tr")).toBe("sadûk, hadisi hasen");
    expect(traduireJugement("قال في التقريب  ثقة", "fr")).toBe("dans al-Taqrīb : fiable");
    expect(traduireJugement("ذكره في الثقات", "es")).toContain("al-Thiqāt");
  });
  it("ne traduit jamais à moitié : phrase inconnue, langue arabe ou texte vide → rien (l'arabe seul s'affiche)", () => {
    expect(traduireJugement("ذكره في الثقات وقال من سادات أهل زمانه", "fr")).toBeNull();
    expect(traduireJugement("ثقة", "ar")).toBeNull();
    expect(traduireJugement(undefined, "fr")).toBeNull();
  });
});
