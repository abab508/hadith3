import { describe,expect,it } from "vitest";
import { decodePostings, readIndex, searchIndex } from "@/donnees/index-leger";
import { compareEditionReferences, editionReferenceUrl } from "@/donnees/recherche-distante";
describe("index compact hadith-api@1",()=>{
 it("décode des postings delta-encodés",()=>{
  // ids [0, 3, 5, 132] => deltas [0,3,2,127]
  expect(decodePostings(Buffer.from([0,3,2,127]).toString("base64"))).toEqual([0,3,5,132]);
 });
 it("cherche correctement avec AND dans une édition indexée",async()=>{
  const index=await readIndex("fra","bukhari");
  expect(index?.source).toBe("fawazahmed0/hadith-api@1");
  const results=searchIndex(index!,"boire");
  expect(results.length).toBeGreaterThan(0);
  expect(results.every(x=>x.numero>0&&x.section>0&&x.dansSection>0)).toBe(true);
  const n=searchIndex(index!,"1");
  expect(n.every(x=>x.numero===1)).toBe(true);
  expect(searchIndex(index!,"motabsentabcdxyz")).toHaveLength(0);
 });
 it("exige numéro ET livre ET rang pour relier les éditions",()=>{
  const fr={numero:9,section:2,dansSection:2};
  expect(compareEditionReferences(fr,{...fr},"ara","bukhari").status).toBe("reference-confirmed");
  expect(compareEditionReferences(fr,{...fr,section:3},"ara","bukhari").status).toBe("number-only");
  expect(compareEditionReferences(fr,{...fr,numero:10},"ara","bukhari").status).toBe("number-only");
  expect(compareEditionReferences(fr,undefined,"ara","bukhari").status).toBe("unavailable");
  expect(editionReferenceUrl("bukhari","ara",9)).toContain("/ara-bukhari/9.min.json");
 });
 it("charge les éditions arabes sans mélanger les langues",async()=>{
  const ar=await readIndex("ara","bukhari");
  const fr=await readIndex("fra","bukhari");
  expect(ar?.docs.length).toBe(fr?.docs.length);
  expect(searchIndex(ar!,"الاعمال").length).toBeGreaterThan(0);
 });
});
