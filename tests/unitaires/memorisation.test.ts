import { describe, expect, it } from "vitest";
import brut from "../../data/hadiths/exemples.json";
import ar from "../../messages/ar.json";
import { extraitsMemorisation } from "@/donnees/memorisation";
import { questionMemoire } from "@/donnees/question-memoire";

describe("atelier de mémorisation documentaire", () => {
  const cartes = extraitsMemorisation();

  it("affiche uniquement les extraits arabes existants du corpus", () => {
    expect(cartes).toHaveLength(brut.hadiths.length);
    for (const carte of cartes) {
      const source = brut.hadiths.find(h => h.id === carte.id);
      expect(source).toBeDefined();
      expect(carte.texteAr).toBe(source?.requeteAr);
      expect(carte.referenceNumero).toBe(source?.occurrences[0]?.numero);
      expect(carte.statut).toBe("exemple-a-valider");
    }
  });

  it("masque un mot sans jamais changer le texte d'origine", () => {
    for (const carte of cartes) {
      const question = questionMemoire(carte, cartes);
      expect(question).not.toBeNull();
      if (!question) continue;
      const reconstruit = [question.avant, question.reponse, question.apres].filter(Boolean).join(" ");
      expect(reconstruit).toBe(carte.texteAr.trim().split(/\s+/u).join(" "));
      expect(question.propositions).toHaveLength(3);
      expect(new Set(question.propositions).size).toBe(3);
      expect(question.propositions.filter(x=>x===question.reponse)).toHaveLength(1);
    }
  });

  it("emploie l'arabe dans la navigation et rappelle le statut non validé", () => {
    expect(ar.navigation.memorisation).toMatch(/[\u0600-\u06FF]/u);
    expect(ar.accueil.titre).toMatch(/^[\u0600-\u06FF]+$/u);
    expect(ar.memorisation.avertissement).toContain("لم تُراجع");
  });
});
