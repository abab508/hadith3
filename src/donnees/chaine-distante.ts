/**
 * Lecture PRUDENTE de l'isnād depuis le texte arabe d'une édition identifiée.
 * La segmentation est mécanique : elle ne démontre ni identité, ni continuité,
 * ni fiabilité. On n'ajoute aucun jugement sans référence biographique.
 */
export type MaillonExterne={
  id:string;nomAr:string;fragment:string;rang:number;
  verdict:"non-evalue"|"compagnon"|"source";
  qualification?:{fr:string;ar:string;en:string};
  bio?:{fr:string;ar:string;en:string};
  critique?:string;reference?:string;referenceUrl?:string;
};
export type ChaineExterneResult={
  etat:"complete-apparente"|"partielle"|"indisponible";
  maillons:MaillonExterne[];extrait:string;mentionRenvoi:boolean;sourceArabe:string;
};
const enlDiacritiques=(texte:string)=>texte.normalize("NFD")
  .replace(/[\u064b-\u065f\u0670\u0640]/gu,"")
  .replace(/[إأآٱ]/gu,"ا").replace(/ى/gu,"ي")
  .replace(/\s+/gu," ").trim();
const marker=/(?:^|[\s،,;:.])(?:و?(?:حدثنا|حدثني|حدثناه|اخبرنا|اخبرني|انبانا|سمعت|سمع|عن))(?=\s)/gu;
const stopAt=/(?:عن\s+)?(?:النبي|رسول\s+الله)(?=[\s،,.:]|$)/u;
const renvoi=/(?:بهذا\s+الاسناد|باسناده|بمثله|نحوه|بنحو\s+حديثه)/u;
function nomPropre(segment:string){
 let s=segment.replace(/^[\s،,.:؛"«»]+|[\s،,.:؛"«»]+$/gu,"").trim();
 // "قال حدثني" est un séparateur, "قال" seul n'est pas un narrateur.
 s=s.replace(/(?:[,،:]\s*)?قال\s*$/u,"").replace(/^\s*(?:قال|فقال)\s*[:،]?\s*/u,"");
 s=s.replace(/[-ـ]\s*رض(?:ي|ى)\s+الله\s+عنه(?:ا|م)?\s*[-ـ]?/gu,"");
 s=s.replace(/\s+/gu," ").replace(/[\s،,.:؛]+$/gu,"").trim();
 if(s.length<2||s.length>110||/\b(?:بهذا|الاسناد|مثله|نحوه|الحديث)\b/u.test(s))return "";
 if(/^(?:النبي|رسول|الله|هو|هي|قال)$/u.test(s))return "";
 return s;
}
function remarqueSpecialisee(recueil:string,numero:number,nomAr:string){
 // Lien MANUEL et limité à cette notice. Ne jamais assimiler deux homonymes automatiquement.
 if(recueil==="sahih-bukhari"&&numero===1804&&nomAr==="ابي هريره"){
   return {
     verdict:"compagnon" as const,
     qualification:{fr:"Compagnon : probité présumée selon la méthode sunnite",ar:"صحابي، تقرر عدالته في منهج أهل السنة",en:"Companion: presumed upright in Sunni hadith methodology"},
     bio:{fr:"Abū Hurayra, compagnon connu pour sa transmission des hadiths. Cette attribution concerne le nom explicite dans le texte cité.",ar:"أبو هريرة من كبار الصحابة رواية للحديث، وهذه إحالة إلى الاسم الوارد صراحة في الإسناد.",en:"Abu Hurayra is a Companion known for hadith transmission. This note is linked only to the explicit name in this chain."},
     critique:"al-Dhahabī",reference:"Siyar Aʿlām al-Nubalāʾ, vol. 2, notice Abū Hurayra",
     referenceUrl:"https://www.islamweb.net/ar/library/content/60/264/أبو-هريرة"
   };
 }
 return {verdict:"non-evalue" as const};
}
export function extraireChaineArabe(texte:string,recueil:string,numero:number,sourceArabe:string):ChaineExterneResult{
 const compact=enlDiacritiques(texte);
 const renvoiTrouve=renvoi.test(compact);
 const limite=compact.search(stopAt);
 const avant=compact.slice(0,limite<0?Math.min(compact.length,1700):limite);
 const markers=[...avant.matchAll(marker)].slice(0,22).map(m=>({start:m.index!,end:m.index!+m[0].length}));
 const noms:string[]=[];
 for(let i=0;i<markers.length;i++){
  const a=markers[i]!,b=markers[i+1];
  const nom=nomPropre(avant.slice(a.end,b?.start??avant.length));
  if(!nom)continue;
  if(noms[noms.length-1]===nom)continue;
  noms.push(nom);
  if(noms.length>=16)break;
 }
 if(noms.length===0){
   return {etat:"indisponible",maillons:[],mentionRenvoi:renvoiTrouve,extrait:avant.slice(0,300),sourceArabe};
 }
 // L'ordre du fichier est du compilateur vers le dernier rapporteur ;
 // l'interface présente la source en premier comme dans le rapport existant.
 const maillons=noms.reverse().map((nom,i):MaillonExterne=>{
   const fiche=remarqueSpecialisee(recueil,numero,nom);
   return {id:"externe-"+i,nomAr:nom,fragment:nom,rang:i+1,...fiche};
 });
 if(limite>=0){
   maillons.unshift({id:"source-prophete",nomAr:"النبي ﷺ",fragment:"النبي",rang:0,verdict:"source"});
 }
 const apparent=limite>=0&&!renvoiTrouve&&noms.length>=2;
 return {
   etat:apparent?"complete-apparente":"partielle",
   maillons:maillons.map((x,i)=>({...x,rang:i+1})),
   mentionRenvoi:renvoiTrouve,extrait:avant.slice(0,620),sourceArabe
 };
}
