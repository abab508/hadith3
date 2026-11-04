/**
 * Lecture et présentation des hadiths à partir des éditions publiques.
 * Références et traductions ne sont jamais "certifiées" par le site.
 */
import {
  EXTERNAL_COLLECTIONS, canUseRemote, editionReferenceUrl, fetchRemoteEdition,
  compareEditionReferences, type RemoteEdition, type RemoteRow
} from "@/donnees/recherche-distante";
import { readIndex, type SearchCandidate } from "@/donnees/index-leger";

export const DETAIL_LANGUAGES=["ara","fra","eng","urd","tur","ind"] as const;
export type DetailLanguage=typeof DETAIL_LANGUAGES[number];

export type DetailHadith={
  collection:typeof EXTERNAL_COLLECTIONS[number];
  language:DetailLanguage;
  number:number;
  hadith:RemoteRow;
  metadata:RemoteEdition["metadata"];
  sourceUrl:string;
  other?:{language:"fra"|"ara";hadith:RemoteRow;sourceUrl:string};
  counterpartStatus:"matched"|"unavailable"|"not-verified";
};

export function validDetailParams(recueil:string,language:string,number:string){
  const collection=EXTERNAL_COLLECTIONS.find(c=>c.id===recueil);
  const n=Number(number);
  if(!collection||!DETAIL_LANGUAGES.includes(language as DetailLanguage)||
     !/^[1-9]\d{0,5}$/.test(number)||!Number.isSafeInteger(n)||n>100000||
     !canUseRemote(collection,language))return null;
  return {collection,language:language as DetailLanguage,number:n};
}

export function pickHadith(edition:RemoteEdition,number:number):RemoteRow|null{
  return edition.hadiths?.find(h=>h.hadithnumber===number && typeof h.text==="string" &&
    h.text.length>0 && h.text.length<=15000)??null;
}

export function citationMatches(
  current:RemoteRow,paired:RemoteRow,currentRef:SearchCandidate|undefined,
  pairedRef:SearchCandidate|undefined
):boolean{
  if(!currentRef||!pairedRef)return false;
  // Double contrôle du numéro et des positions, dans le fichier distant ET l'index compact.
  const ref=current.reference,other=paired.reference;
  if(!ref||!other||!Number.isSafeInteger(ref.book)||!Number.isSafeInteger(ref.hadith)||
    !Number.isSafeInteger(other.book)||!Number.isSafeInteger(other.hadith))return false;
  return current.hadithnumber===paired.hadithnumber &&
    currentRef.numero===current.hadithnumber &&
    currentRef.section===ref.book &&currentRef.dansSection===ref.hadith &&
    pairedRef.numero===paired.hadithnumber &&
    pairedRef.section===other.book &&pairedRef.dansSection===other.hadith &&
    compareEditionReferences(currentRef,pairedRef,"ara","bukhari").status==="reference-confirmed";
}

export async function loadDetail(
  recueil:string,language:string,number:string
):Promise<DetailHadith|null>{
 const parsed=validDetailParams(recueil,language,number);
 if(!parsed)return null;
 const {collection,language:lang,number:n}=parsed;
 const edition=await fetchRemoteEdition(collection,lang,n);
 const hadith=pickHadith(edition,n);
 if(!hadith)return null;
 const result:DetailHadith={
  collection,language:lang,number:n,hadith,metadata:edition.metadata,
  sourceUrl:editionReferenceUrl(collection.key,lang,n),
  counterpartStatus:"unavailable"
 };
 const other=lang==="fra"?"ara":lang==="ara"?"fra":null;
 if(!other||!canUseRemote(collection,other))return result;
 const [originalIndex,otherIndex]=await Promise.all([
  readIndex(lang,collection.key),readIndex(other,collection.key)
 ]);
 const self=originalIndex?.docs.find(d=>d[0]===n);
 const alt=otherIndex?.docs.find(d=>d[0]===n);
 if(!self||!alt)return result;
 const a={numero:self[0],section:self[1],dansSection:self[2]};
 const b={numero:alt[0],section:alt[1],dansSection:alt[2]};
 if(compareEditionReferences(a,b,other,collection.key).status!=="reference-confirmed"){
  result.counterpartStatus="not-verified";
  return result;
 }
 try{
  const counterpartEdition=await fetchRemoteEdition(collection,other,n);
  const paired=pickHadith(counterpartEdition,n);
  if(paired&&citationMatches(hadith,paired,a,b)){
   result.other={language:other,hadith:paired,sourceUrl:editionReferenceUrl(collection.key,other,n)};
   result.counterpartStatus="matched";
  }else result.counterpartStatus="not-verified";
 }catch{/* Le texte principal reste accessible, même si l'autre édition est indisponible. */}
 return result;
}
