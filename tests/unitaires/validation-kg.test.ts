import { describe,it,expect } from "vitest";
import { verifierRawiImport } from "@/donnees/validation-kg";
describe("contrôle des fiches importées KG",()=>{
 it("accepte une fiche issue d'un export identifié",()=>{
  expect(verifierRawiImport({source:"emadjumaah/hadith-kg",type:"rawi",data:{id:12,name:"Exemple"}})).toMatchObject({ok:true,id:"12"});
 });
 it("rejette les fiches sans identifiant et les sources étrangères",()=>{
  expect(verifierRawiImport({source:"inconnue",type:"rawi",data:{id:12}})).toMatchObject({ok:false});
  expect(verifierRawiImport({source:"emadjumaah/hadith-kg",type:"rawi",data:{name:"Exemple"}})).toMatchObject({ok:false});
 });
});
