/**
 * Index inversé compact : numéros, références et listes de mots.
 * Aucun texte intégral. La lecture a lieu côté serveur, les traductions restent en amont.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normaliser, numeroDemande } from "@/donnees/recherche";

export type SearchIndex = {
  version:1;source:string;edition:string;language:string;book:string;total:number;
  docs:[number,number,number][];
  terms:Record<string,string>;
};
export type SearchCandidate = {numero:number;section:number;dansSection:number};
const REVISION="fawazahmed0/hadith-api@1";
const memo=new Map<string,Promise<SearchIndex|null>>();
export function decodePostings(base64:string):number[]{
 const bytes=Buffer.from(base64,"base64");
 const out:number[]=[];let previous=0,value=0,shift=0;
 for(const b of bytes){
  value+=(b&127)*2**shift;
  if(b&128){shift+=7;if(shift>35)throw Error("Invalid index encoding");continue;}
  previous+=value;
  if(!Number.isSafeInteger(previous))throw Error("Invalid posting id");
  out.push(previous);value=0;shift=0;
 }
 if(shift!==0)throw Error("Truncated index posting");
 return out;
}
export function readIndex(language:string,book:string):Promise<SearchIndex|null>{
 if(!/^[a-z]{3}$/.test(language)||!/^[a-z]+$/.test(book))return Promise.resolve(null);
 const key=language+"-"+book;
 if(!memo.has(key)){
  const file=join(process.cwd(),"data","search-index",key+".json");
  const promise=readFile(file,"utf8").then(text=>{
   const j=JSON.parse(text) as SearchIndex;
   if(j.version!==1||j.source!==REVISION||j.edition!==key||
     !Array.isArray(j.docs)||!j.terms||typeof j.terms!=="object"||j.docs.length!==j.total)
     throw Error("Invalid search index "+key);
   return j;
  }).catch((err:unknown)=>{
   console.warn("Index not available for "+key,err instanceof Error?err.message:"unknown");
   return null;
  });
  memo.set(key,promise);
 }
 return memo.get(key)!;
}
function prefixPostings(index:SearchIndex,word:string):number[]{
 const direct=Object.hasOwn(index.terms,word)?index.terms[word]:undefined;
 if(direct!==undefined)return decodePostings(direct);
 if(word.length<3)return [];
 // Autorise le début d'un mot, comme le moteur local.
 const matched=Object.keys(index.terms).filter(term=>term.startsWith(word)).slice(0,150);
 const all=new Set<number>();
 for(const term of matched)for(const i of decodePostings(index.terms[term]!))all.add(i);
 return [...all].sort((a,b)=>a-b);
}
/** Recherche thématique française : variantes d'un mot réunies par OU, pas par ET.
 * Les termes provenant de l'index restent ceux des éditions (aucun jugement déduit).
 * Une recherche exacte par numéro conserve son comportement initial.
 */
const THEMES_FR:Record<string,string[]>={
 manger:["mang","nourrit","repas","aliment"],
 nourriture:["nourrit","aliment","repas","mang"],
 boire:["boi","buv","breuvage","eau","boisson"],
 priere:["prier","prie","salat","priere"],
};
function variantesDeRecherche(index:SearchIndex,mot:string):string[]{
 if(index.language!=="fra")return [mot];
 const variantes=THEMES_FR[mot];
 return variantes?[mot,...variantes]:[mot];
}
function postingsPourMot(index:SearchIndex,mot:string):number[]{
 const ids=new Set<number>();
 for(const terme of variantesDeRecherche(index,mot)){
  for(const id of prefixPostings(index,terme))ids.add(id);
 }
 return [...ids].sort((a,b)=>a-b);
}
export function searchIndex(index:SearchIndex,query:string):SearchCandidate[]{
 const number=numeroDemande(query);
 if(number)return index.docs.filter(d=>String(d[0])===number)
     .map(d=>({numero:d[0],section:d[1],dansSection:d[2]}));
 const forme=normaliser(query);
 // Mot du quotidien absent des traductions (ex. « migraine ») : on cherche les formulations des textes.
 const concept=(index.language==="ara"?CONCEPTS_AR:CONCEPTS_FR)[forme];
 if(concept){
  const ids=new Set<number>();
  for(const alternative of [[forme],...concept])for(const id of idsPourMots(index,alternative))ids.add(id);
  return [...ids].sort((x,y)=>x-y).flatMap(id=>{const doc=index.docs[id];return doc?[{numero:doc[0],section:doc[1],dansSection:doc[2]}]:[];});
 }
 const words=[...new Set(forme.split(" ").filter(Boolean))];
 if(words.length===0||words.length>8||words.some(x=>x.length>55))return [];
 return idsPourMots(index,words).flatMap(id=>{const doc=index.docs[id];return doc?[{numero:doc[0],section:doc[1],dansSection:doc[2]}]:[];});
}

// Documents qui contiennent TOUS les mots (chaque mot accepte ses variantes et ses débuts de mot).
function idsPourMots(index:SearchIndex,words:string[]):number[]{
 const postings=words.map(x=>postingsPourMot(index,x)).sort((a,b)=>a.length-b.length);
 if(!postings[0]?.length)return [];
 const remaining=postings.slice(1).map(p=>new Set(p));
 return postings[0].filter(id=>remaining.every(set=>set.has(id)));
}

/**
 * Mots courants qui n'apparaissent pas tels quels dans les éditions : chaque entrée donne d'autres
 * recherches équivalentes (tous les mots d'une même ligne doivent être présents). Aucun texte n'est ajouté :
 * on ne fait que retrouver les hadiths qui emploient une autre formulation.
 */
const MAL_DE_TETE=[["douleur","tete"],["souffr","tete"],["migraine"],["cephal"]];
export const CONCEPTS_FR:Record<string,string[][]>={
 migraine:MAL_DE_TETE,migraines:MAL_DE_TETE,cephalee:MAL_DE_TETE,cephalees:MAL_DE_TETE,
 "mal de tete":MAL_DE_TETE,"maux de tete":MAL_DE_TETE,"mal a la tete":MAL_DE_TETE,"douleur a la tete":MAL_DE_TETE,
 grippe:[["rhume"],["fievre"]],
 depression:[["tristesse"],["chagrin"],["angoisse"]],
 stress:[["angoisse"],["inquiet"],["anxiete"]],anxiete:[["angoisse"],["inquiet"]],
};
const SUDAA=[["صداع"],["صدع"],["وجع","راس"]];
export const CONCEPTS_AR:Record<string,string[][]>={
 "صداع":SUDAA,"الصداع":SUDAA,"وجع الراس":SUDAA,"الم الراس":SUDAA,
};
