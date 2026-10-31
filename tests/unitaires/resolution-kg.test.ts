import { describe,it,expect } from "vitest";
import { resoudreRawiParLien } from "@/donnees/resolution-kg";
const fiche={source:"emadjumaah/hadith-kg" as const,type:"rawi" as const,data:{id:15,nom:"example"}};
const lien={source:"emadjumaah/hadith-kg" as const,sanadId:"4",position:2,rawiId:"15"};
describe("liaison documentaire par identifiants",()=>{
 it("accepte uniquement l'identifiant exact du maillon",()=>{
  expect(resoudreRawiParLien(lien,fiche)).toMatchObject({status:"verified",id:"15"});
 });
 it("rejette un homonyme avec une autre clé",()=>{
  expect(resoudreRawiParLien({...lien,rawiId:"16"},fiche)).toMatchObject({status:"unresolved"});
 });
 it("rejette une position de chaîne incorrecte",()=>{
  expect(resoudreRawiParLien({...lien,position:-1},fiche)).toMatchObject({status:"unresolved"});
 });
});
