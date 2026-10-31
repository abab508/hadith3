/**
 * Liaison vérifiable entre chaîne et transmetteur KG.
 * Aucune identification par similitude des noms.
 */
import { verifierRawiImport, type RawiImport } from "@/donnees/validation-kg";

export type LienTransmission = {
 source:"emadjumaah/hadith-kg";
 sanadId:string;
 position:number;
 rawiId:string;
};
export type ResolutionKG =
 | {status:"verified";id:string;fiche:Record<string,unknown>;sanadId:string;position:number}
 | {status:"unresolved";reason:string};

export function resoudreRawiParLien(
 lien:LienTransmission,
 document:RawiImport,
):ResolutionKG{
 if(lien.source!=="emadjumaah/hadith-kg"||
 !/^[1-9][0-9]{0,15}$/.test(lien.sanadId)||
 !/^[1-9][0-9]{0,15}$/.test(lien.rawiId)||
 !Number.isSafeInteger(lien.position)||lien.position<0||lien.position>100)
 return {status:"unresolved",reason:"Lien de transmission invalide"};
 const fiche=verifierRawiImport(document);
 if(!fiche.ok)return {status:"unresolved",reason:fiche.reason};
 if(fiche.id!==lien.rawiId)
 return {status:"unresolved",reason:"Identifiant KG différent de celui du maillon"};
 return {status:"verified",id:fiche.id,fiche:fiche.data,sanadId:lien.sanadId,position:lien.position};
}
