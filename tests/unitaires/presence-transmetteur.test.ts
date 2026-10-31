import { describe, expect, it } from "vitest";
import { corpus, hadithParId } from "@/donnees/corpus";
import { presenceDansHadith } from "@/donnees/presence-transmetteur";

describe("fiche du transmetteur pour le hadith sélectionné", () => {
  it("associe un maillon à la référence et à sa position réelle dans la chaîne", () => {
    const h = hadithParId("bukhari-8")!;
    const positions = presenceDansHadith(h,"b8-3");
    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({
      voieId:"bukhari",ouvrageId:"sahih-bukhari",numero:"8",
      position:5,total:8,partieCommune:true,precedentId:"b8-4",suivantId:"b8-2"
    });
    const tr = corpus.transmetteurs.find(x=>x.id==="b8-3")!;
    expect(tr.categorie).toBe("non-evalue");
    expect(tr.jugements).toHaveLength(0);
  });
  it("retrouve les deux voies d'un même maillon commun sans les confondre", () => {
    const h=hadithParId("niyyat")!;
    const result=presenceDansHadith(h,"umar");
    expect(result).toHaveLength(2);
    expect(result.map(x=>x.numero)).toEqual(["1","1907"]);
    expect(result.every(x=>x.partieCommune)).toBe(true);
  });
  it("ne rattache pas un narrateur au mauvais hadith", () => {
    const h=hadithParId("bukhari-2")!;
    expect(presenceDansHadith(h,"b8-3")).toEqual([]);
  });
  it("retrouve un compilateur en dernière position d'une voie", () => {
    const h=hadithParId("bukhari-8")!;
    const result=presenceDansHadith(h,"bukhari");
    expect(result[0]?.position).toBe(result[0]?.total);
    expect(result[0]?.suivantId).toBeNull();
    expect(result[0]?.partieCommune).toBe(false);
  });
});
