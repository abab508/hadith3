import {describe,it,expect} from "vitest";
import {classification,chapitreParSlug,schemaClassification} from "@/donnees/themes";
describe("classification thématique",()=>{
 it("présente seize grands chapitres",()=>expect(classification.chapitres).toHaveLength(16));
 it("comprend le mariage, les ablutions, le commerce et les signes de l'Heure",()=>{
  const sujets=classification.chapitres.flatMap(c=>c.themes.map(t=>t.slug));
  for(const slug of ["mariage","ablutions","vente","dajjal"])expect(sujets).toContain(slug);
 });
 it("chaque thème possède un libellé arabe, français et anglais",()=>{
  for(const chapitre of classification.chapitres){
   for(const langue of ["ar","fr","en"] as const)expect(chapitre.nom[langue].length).toBeGreaterThan(0);
   for(const theme of chapitre.themes)for(const langue of ["ar","fr","en"] as const)
    expect(theme.nom[langue].length).toBeGreaterThan(0);
  }
 });
 it("n'attribue aucun hadith sans preuve",()=>{
  expect(JSON.stringify(classification)).not.toMatch(/statutVerification|hadithId|references/);
 });
 it("valide les slugs uniques et rejette un doublon",()=>{
  const duplique=structuredClone(classification);duplique.chapitres.push(duplique.chapitres[0]!);
  expect(schemaClassification.safeParse(duplique).success).toBe(false);
  expect(chapitreParSlug("famille")?.themes.some(t=>t.slug==="mariage")).toBe(true);
 });
});
