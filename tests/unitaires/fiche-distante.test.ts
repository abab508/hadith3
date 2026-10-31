import { describe,expect,it } from "vitest";
import { validDetailParams,pickHadith,citationMatches } from "@/donnees/fiche-distante";
describe("Fiche lisible des références distantes",()=>{
 it("refuse toute route arbitraire, numéro hors borne ou recueil inconnu",()=>{
  expect(validDetailParams("sahih-bukhari","fra","1961")?.number).toBe(1961);
  expect(validDetailParams("sahih-bukhari","fra","../1961")).toBeNull();
  expect(validDetailParams("sahih-bukhari","fra","0001")).toBeNull();
  expect(validDetailParams("sahih-bukhari","invalid","1961")).toBeNull();
  expect(validDetailParams("jami-tirmidhi","fra","1")).toBeNull();
  expect(validDetailParams("other","ara","1")).toBeNull();
 });
 it("repère un seul hadith et ses références dans la réponse distante",()=>{
  const row={hadithnumber:1961,arabicnumber:1961,text:"Les gens ont dit : je ne suis pas comme vous.",reference:{book:30,hadith:68},grades:[]};
  expect(pickHadith({hadiths:[row]},1961)).toEqual(row);
  expect(pickHadith({hadiths:[row]},1962)).toBeNull();
  expect(pickHadith({hadiths:[]},1961)).toBeNull();
 });
 it("n'affiche la traduction parallèle que si les références réelles concordent",()=>{
  const fr={hadithnumber:1961,text:"boire",reference:{book:30,hadith:68}};
  const ar={hadithnumber:1961,text:"شرب",reference:{book:30,hadith:68}};
  const indexed={numero:1961,section:30,dansSection:68};
  expect(citationMatches(fr,ar,indexed,indexed)).toBe(true);
  expect(citationMatches(fr,{...ar,reference:{book:30,hadith:69}},indexed,indexed)).toBe(false);
  expect(citationMatches(fr,{...ar,hadithnumber:1962},indexed,indexed)).toBe(false);
  expect(citationMatches(fr,ar,undefined,indexed)).toBe(false);
 });
});
