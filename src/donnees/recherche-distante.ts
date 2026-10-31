/**
 * Recherche fédérée à distance (hadith-api@1), sans copier les recueils sur Render.
 * Les références et les textes viennent de l'édition interrogée. Leur présence
 * ne constitue ni authentification du hadith ni examen individuel du sanad.
 */
import { normaliser, numeroDemande } from "@/donnees/recherche";

export const EXTERNAL_COLLECTIONS = [
  {id:"sahih-bukhari",key:"bukhari",nom:"Ṣaḥīḥ al-Bukhārī",fr:true},
  {id:"sahih-muslim",key:"muslim",nom:"Ṣaḥīḥ Muslim",fr:true},
  {id:"sunan-abi-dawud",key:"abudawud",nom:"Sunan Abī Dāwūd",fr:true},
  {id:"jami-tirmidhi",key:"tirmidhi",nom:"Jāmiʿ al-Tirmidhī",fr:false},
  {id:"sunan-nasai",key:"nasai",nom:"Sunan al-Nasāʾī",fr:true},
  {id:"sunan-ibn-majah",key:"ibnmajah",nom:"Sunan Ibn Mājah",fr:true},
  {id:"muwatta",key:"malik",nom:"Muwaṭṭaʾ Mālik",fr:true}
] as const;
export type ExternalCollection = typeof EXTERNAL_COLLECTIONS[number];
export type RemoteRow = {
  hadithnumber: number; arabicnumber?: number|string;
  text: string; grades?: {name?:string;grade?:string}[];
  reference?: {book?:number;hadith?:number};
};
export type RemoteEdition = {
  metadata?: {name?:string;section?:Record<string,string>;section_detail?:Record<string,unknown>};
  hadiths?:RemoteRow[];
};
export type RemoteHit = {id:string;recueil:string;nom:string;numero:number;section?:number;texte:string;langue:string;sourceUrl:string;grades:{name:string;grade:string}[]};
export type RemoteSearchResult = {items:RemoteHit[];total:number;page:number;pageTotal:number;checked:number;unavailable:string[];searchedLanguages:string[]};
const PREFIX="https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/";
const FALLBACK="https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/";
const remoteRevision="fawazahmed0/hadith-api@1";
export const externalSourceRevision=remoteRevision;
const expiration=10*60*1000;
const cache=new Map<string,{expires:number;items:RemoteHit[];checked:number;unavailable:string[];languages:string[]}>();

export function remoteLanguage(locale:string,search:string){
  if(/[\u0600-\u06ff]/u.test(search))return "ara";
  const known:Record<string,string>={fr:"fra",en:"eng",ar:"ara",ur:"urd",tr:"tur",id:"ind",ms:"ind"};
  return known[locale]??"eng";
}
export function canUseRemote(collection:ExternalCollection,lang:string){
  return lang!=="fra"||collection.fr;
}
export function editionUrl(key:string,language:string,number?:number){
  return PREFIX+language+"-"+key+(number?"/"+number:"")+".min.json";
}
export function editionReferenceUrl(key:string,language:string,number:number){
  return editionUrl(key,language,number);
}
function validRow(row:unknown): row is RemoteRow{
  if(typeof row!=="object"||row===null)return false;
  const r=row as Record<string,unknown>;
  return Number.isSafeInteger(r.hadithnumber)&&typeof r.text==="string";
}
export function extractHits(edition:RemoteEdition,collection:ExternalCollection,language:string,query:string):RemoteHit[]{
  const keywords=normaliser(query).split(" ").filter(Boolean);
  const numeric=numeroDemande(query);
  const out:RemoteHit[]=[];
  for(const raw of edition.hadiths??[]){
    if(!validRow(raw)||raw.text.length===0||raw.text.length>15000)continue;
    const n=raw.hadithnumber;
    if(n<=0||n>100000)continue;
    const matches=numeric?String(n)===numeric:keywords.every(word=>normaliser(raw.text).includes(word));
    if(!matches)continue;
    const sect=raw.reference?.book;
    const grades=Array.isArray(raw.grades)?raw.grades.filter(v=>v&&typeof v.name==="string"&&typeof v.grade==="string").slice(0,4).map(v=>({name:v.name!,grade:v.grade!})):[];
    out.push({
      id:collection.key+"-"+language+"-"+n,
      recueil:collection.id,nom:collection.nom,numero:n,
      section:typeof sect==="number"&&Number.isSafeInteger(sect)?sect:undefined,
      texte:raw.text,langue:language,
      sourceUrl:editionReferenceUrl(collection.key,language,n),
      grades
    });
  }
  return out;
}
const requestTimeout=16000;
export async function fetchRemoteEdition(collection:ExternalCollection,lang:string,number?:number):Promise<RemoteEdition>{
  if(!canUseRemote(collection,lang))throw new Error("Edition not available in this language");
  const suffix=lang+"-"+collection.key+(number?"/"+number:"")+".min.json";
  let lastError:unknown;
  for(const base of [PREFIX,FALLBACK]){
    try{
      const res=await fetch(base+suffix,{
        headers:{accept:"application/json"},
        signal:AbortSignal.timeout(requestTimeout),
        next:{revalidate:1800}
      });
      if(!res.ok)throw new Error("Hadith API response "+res.status);
      const edition=await res.json() as RemoteEdition;
      if(!Array.isArray(edition.hadiths))throw new Error("Invalid edition format");
      return edition;
    }catch(e){lastError=e;}
  }
  throw new Error("Remote source temporarily unavailable", {cause:lastError});
}
export async function remoteSearch(q:string,selected:string|undefined,lang:string,pageRequested:number,pageSize=10):Promise<RemoteSearchResult>{
  const query=q.trim().slice(0,90),chosen=EXTERNAL_COLLECTIONS.filter(c=>!selected||c.id===selected);
  if(!query||chosen.length===0)return {items:[],total:0,page:1,pageTotal:1,checked:0,unavailable:[],searchedLanguages:[lang]};
  const searchKey=JSON.stringify([query,selected??"",lang]);
  const old=cache.get(searchKey);
  let record=old&&old.expires>Date.now()?old:undefined;
  if(!record){
    const hits:RemoteHit[]=[];
    const unavailable:string[]=[];
    let checked=0;
    // Ne jamais télécharger tous les recueils simultanément : mémoire limitée sur Render Free.
    for(let offset=0;offset<chosen.length;offset+=2){
      const pair=chosen.slice(offset,offset+2);
      const results=await Promise.allSettled(pair.map(async c=>{
        if(!canUseRemote(c,lang))return {status:"language" as const,collection:c};
        const edition=await fetchRemoteEdition(c,lang);
        return {status:"ok" as const,collection:c,edition};
      }));
      for(let i=0;i<pair.length;i++){
        const row=results[i]!;
        if(row.status!=="fulfilled"||row.value.status==="language"){
          unavailable.push(pair[i]!.nom);continue;
        }
        checked++;
        hits.push(...extractHits(row.value.edition,row.value.collection,lang,query));
      }
    }
    hits.sort((a,b)=>EXTERNAL_COLLECTIONS.findIndex(x=>x.id===a.recueil)-EXTERNAL_COLLECTIONS.findIndex(x=>x.id===b.recueil)||a.numero-b.numero);
    record={expires:Date.now()+expiration,items:hits,checked,unavailable,languages:[lang]};
    if(cache.size>=12)cache.delete(cache.keys().next().value!);
    cache.set(searchKey,record);
  }
  const pageTotal=Math.max(1,Math.ceil(record.items.length/pageSize));
  const page=Number.isSafeInteger(pageRequested)?Math.min(Math.max(pageRequested,1),pageTotal):1;
  return {items:record.items.slice((page-1)*pageSize,page*pageSize),total:record.items.length,page,pageTotal,checked:record.checked,unavailable:record.unavailable,searchedLanguages:record.languages};
}
export function escapeCsv(value:unknown):string{
  const v=String(value??"").replace(/\0/g,"");
  const safe=/^[\t\n\r ]*[=+\-@]/.test(v)?"'"+v:v;
  return '"'+safe.replaceAll('"','""')+'"';
}
export function exportEditionCsv(edition:RemoteEdition,collection:ExternalCollection,lang:string):string{
  const headers=["collection","edition","hadithnumber","arabicnumber","book","hadith_in_book","text","grades_as_published","source_revision","source_url"];
  const lines=[headers.map(escapeCsv).join(",")];
  for(const r of edition.hadiths??[]){
    if(!validRow(r))continue;
    const rawGrades=Array.isArray(r.grades)?JSON.stringify(r.grades):"";
    lines.push([
      collection.nom,lang+"-"+collection.key,r.hadithnumber,r.arabicnumber??"",
      r.reference?.book??"",r.reference?.hadith??"",r.text,rawGrades,remoteRevision,
      editionReferenceUrl(collection.key,lang,r.hadithnumber)
    ].map(escapeCsv).join(","));
  }
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
