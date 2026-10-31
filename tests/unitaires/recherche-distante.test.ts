import { describe,expect,it } from "vitest";
import { EXTERNAL_COLLECTIONS,extractHits,remoteLanguage,canUseRemote,exportEditionCsv,escapeCsv,editionUrl } from "@/donnees/recherche-distante";

const book=EXTERNAL_COLLECTIONS[0];
const edition={
  hadiths:[
    {hadithnumber:7,arabicnumber:7,text:"Il prit de l'eau pour boire et s'abreuver.",reference:{book:1,hadith:7},grades:[]},
    {hadithnumber:8,arabicnumber:8,text:"Il demanda à boire de l'eau.",reference:{book:1,hadith:8},grades:[{name:"Critique",grade:"Hasan"}]},
    {hadithnumber:9,arabicnumber:9,text:"L'homme pria au matin.",reference:{book:1,hadith:9},grades:[]},
  ]
};
describe("Recherche fédérée à la demande",()=>{
  it("cherche le mot-clé français dans le texte traduit, sans base locale",()=>{
    const found=extractHits(edition,book,"fra","boire");
    expect(found.map(x=>x.numero)).toEqual([7,8]);
    expect(found[0]?.sourceUrl).toContain("fra-bukhari/7.min.json");
    expect(found[1]?.grades).toEqual([{name:"Critique",grade:"Hasan"}]);
  });
  it("cherche un numéro entier sans confusion avec un autre",()=>{
    expect(extractHits(edition,book,"fra","8").map(x=>x.numero)).toEqual([8]);
    expect(extractHits(edition,book,"fra","18")).toHaveLength(0);
  });
  it("garde la distinction entre éditions disponibles et absentes",()=>{
    expect(EXTERNAL_COLLECTIONS).toHaveLength(7);
    const t=EXTERNAL_COLLECTIONS.find(x=>x.key==="tirmidhi")!;
    expect(canUseRemote(t,"fra")).toBe(false);
    expect(canUseRemote(t,"ara")).toBe(true);
    expect(remoteLanguage("fr","boire")).toBe("fra");
    expect(remoteLanguage("fr","ماء")).toBe("ara");
  });
  it("produit un CSV avec provenance et protection contre formules Excel",()=>{
    const csv=exportEditionCsv(edition,book,"fra");
    expect(csv).toContain("source_revision");
    expect(csv).toContain("fawazahmed0/hadith-api@1");
    expect(csv).toContain("Il demanda à boire");
    expect(escapeCsv("=1+1")).toBe('"\\'=1+1"');
    expect(editionUrl("bukhari","ara")).toContain("ara-bukhari.min.json");
  });
});
