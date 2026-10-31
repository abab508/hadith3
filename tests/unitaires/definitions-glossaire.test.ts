import { describe, expect, it } from "vitest";
import { termes } from "@/donnees/termes";
import { definitionGlossaire, definitionsGlossaire } from "@/donnees/definitions-glossaire";

describe("définitions du glossaire",()=>{
  it("explique les 38 termes en français, en arabe et en anglais",()=>{
    expect(Object.keys(definitionsGlossaire)).toHaveLength(38);
    for(const t of termes.termes) {
      for(const locale of ["fr","ar","en"]) {
        const d=definitionGlossaire(t.id,locale);
        expect(d, t.id+"/"+locale).toBeDefined();
        expect(d?.texte.length, t.id+"/"+locale).toBeGreaterThan(35);
        expect(d?.texte).not.toMatch(/spécialiste|specialist|valider|validation|بانتظار|مراجعة متخصص/iu);
      }
    }
  });
  it("ne confond pas hadith faible et récit fabriqué",()=>{
    expect(definitionGlossaire("daif-hadith","fr")?.texte).toContain("ne signifie pas nécessairement inventé");
    expect(definitionGlossaire("mawdu","fr")?.texte).toContain("fabriqué");
  });
  it("affiche le texte arabe avec le bon sens de lecture",()=>{
    const d=definitionGlossaire("sahih","ar");
    expect(d?.direction).toBe("rtl");
    expect(d?.langue).toBe("ar");
    expect(d?.texte).toContain("حديث");
  });
});
