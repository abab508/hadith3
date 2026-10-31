/** Registre documentaire commun, limité aux notices locales déjà présentes.
 * Aucun appariement par sous-chaîne ni homonyme. Les fiches locales sont
 * des données à valider, non des certifications scientifiques.
 */
import { corpus, ouvrageParId } from "@/donnees/corpus";
import type { MaillonExterne } from "@/donnees/chaine-distante";

const normaliserNom=(s:string)=>s.normalize("NFD")
 .replace(/[\u064b-\u065f\u0670\u0640]/gu,"")
 .replace(/[إأآٱ]/gu,"ا").replace(/ى/gu,"ي").replace(/ة/g,"ه")
 .replace(/\s+/gu," ").trim();

const index=new Map<string,typeof corpus.transmetteurs>();
for(const item of corpus.transmetteurs){
 const key=normaliserNom(item.nomAr);
 index.set(key,[...(index.get(key)??[]),item]);
}
export function noticeLocaleExacte(nomAr:string):Partial<MaillonExterne>|null{
 const key=normaliserNom(nomAr);
 if(key.length<9)return null;
 const matches=index.get(key)??[];
 // Un homonyme ou un nom non documenté ne déclenche aucune attribution.
 if(matches.length!==1)return null;
 const found=matches[0]!;
 const source=found.sources.find(s=>s.reference&&ouvrageParId(s.ouvrage));
 if(!source)return null;
 const ouvrage=ouvrageParId(source.ouvrage);
 const bio=found.biographie;
 const classification=found.categorie;
 // Le classement local sans critique précisément citée ne vaut pas preuve.
 const verdict=classification==="compagnon"?"compagnon" as const:
    classification==="thiqa"&&found.jugements.length>0?"thiqa" as const:"non-evalue" as const;
 return {
   verdict,nomCompletAr:found.nomAr,nomLatin:found.nomTranslittere,
   bio:{fr:bio.fr??bio.ar??"",en:bio.en??bio.ar??"",ar:bio.ar??""},
   reference:(ouvrage?.nom??source.ouvrage)+" — "+source.reference,
   // Pas de lien inventé lorsque le corpus ne fournit pas d'URL.
 };
}
