/**
 * Lecture PRUDENTE de l'isnād depuis le texte arabe d'une édition identifiée.
 * La segmentation est mécanique : elle ne démontre ni identité, ni continuité,
 * ni fiabilité. On n'ajoute aucun jugement sans référence biographique.
 */
import { noticeHadith79, type CritiqueRijal } from "@/donnees/rijal-hadith-79";
export type MaillonExterne={
  id:string;nomAr:string;fragment:string;rang:number;
  verdict:"non-evalue"|"compagnon"|"source"|"compilateur"|"thiqa"|"divergent";
  qualification?:{fr:string;ar:string;en:string};
  bio?:{fr:string;ar:string;en:string};
  critique?:string;reference?:string;referenceUrl?:string;
  nomCompletAr?:string;nomLatin?:string;maitres?:string[];eleves?:string[];jugements?:CritiqueRijal[];
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
 s=s.replace(/(?:\s+|[-ـ])رض(?:ي|ى)\s+الله\s+عنه(?:ا|م)?\s*[-ـ]?/gu,"");
 s=s.replace(/\s+/gu," ").replace(/[\s،,.:؛]+$/gu,"").trim();
 if(s.length<2||s.length>110||/\b(?:بهذا|الاسناد|مثله|نحوه|الحديث)\b/u.test(s))return "";
 if(/^(?:النبي|رسول|الله|هو|هي|قال)$/u.test(s))return "";
 return s;
}
function remarqueSpecialisee(recueil:string,numero:number,nomAr:string){
 // Lien MANUEL et limité à cette notice. Ne jamais assimiler deux homonymes automatiquement.
 const documente79=noticeHadith79(recueil,numero,nomAr);
 if(documente79)return documente79;

 // Dossier éditorial ciblé : l'identification des noms abrégés pour ce récit
 // est corroborée par https://hadith-web-production.up.railway.app/hadith/3189.
 // La qualification concerne la PERSONNE citée, jamais la validité totale du hadith.
 if(recueil==="sahih-bukhari"&&numero===1961){
   const notices:Record<string,{
      verdict:"thiqa"|"compagnon";
      qualification:{fr:string;ar:string;en:string};
      bio:{fr:string;ar:string;en:string};
      critique:string;reference:string;referenceUrl:string;
   }>={
     "انس":{
       verdict:"compagnon",
       qualification:{fr:"Compagnon : probité admise dans la tradition sunnite",ar:"صحابي، تقرر عدالته في منهج أهل السنة",en:"Companion: uprightness accepted in Sunni hadith methodology"},
       bio:{fr:"Anas ibn Mālik, compagnon et serviteur du Prophète ﷺ. Al-Dhahabī le présente comme l'un des grands transmetteurs.",ar:"أنس بن مالك صاحب رسول الله ﷺ وخادمه، ومن كبار رواة الحديث.",en:"Anas ibn Malik was a Companion and servant of the Prophet, known for transmitting hadith."},
       critique:"al-Dhahabī",reference:"Siyar Aʿlām al-Nubalāʾ, vol. 3, notice Anas ibn Mālik",
       referenceUrl:"https://www.islamweb.net/ar/library/content/60/358/أنس-بن-مالك"
     },
     "قتادة":{
       verdict:"thiqa",
       qualification:{fr:"Fiable (thiqa) selon Ibn Maʿīn ; les questions de transmission et de tadlīs doivent être examinées séparément.",ar:"ثقة عند ابن معين، وتُبحث مسائل التدليس والسماع في كل طريق على حدة.",en:"Trustworthy according to Ibn Ma'in; possible tadlis and actual hearing require separate chain-specific examination."},
       bio:{fr:"Qatāda ibn Diʿāma al-Sadūsī, savant de Bassora et transmetteur d'Anas. L'identification est limitée à cette chaîne.",ar:"قتادة بن دعامة السدوسي البصري، روى عن أنس بن مالك. التعيين خاص بهذا الإسناد.",en:"Qatada ibn Di'ama al-Sadusi, a Basran transmitter who narrated from Anas; identification is specific to this chain."},
       critique:"Yaḥyā ibn Maʿīn",reference:"al-Mizzī, Tahdhīb al-Kamāl, vol. 23, p. 515–516",
       referenceUrl:"https://sunna.alifta.gov.sa/BookToc/ViewServicePage?bookId=48&mainId=452623"
     },
     "شعبة":{
       verdict:"thiqa",
       qualification:{fr:"Imam et mémorisateur de référence ; al-Dhahabī le présente comme un spécialiste majeur de la critique des transmetteurs.",ar:"إمام حافظ حجة في الحديث، ومن أئمة نقد الرجال.",en:"Leading hadith memorizer and critic, described as an authoritative transmitter by al-Dhahabi."},
       bio:{fr:"Shuʿba ibn al-Ḥajjāj al-ʿAtakī, grand traditionniste de Bassora, transmetteur de Qatāda et maître de Yaḥyā al-Qaṭṭān.",ar:"شعبة بن الحجاج العتكي، من كبار حفاظ البصرة، روى عن قتادة وروى عنه يحيى القطان.",en:"Shu'ba ibn al-Hajjaj, a major Basran hadith scholar who narrated from Qatada and taught Yahya al-Qattan."},
       critique:"al-Dhahabī",reference:"Siyar Aʿlām al-Nubalāʾ, vol. 7, notice Shuʿba",
       referenceUrl:"https://www.islamweb.net/amp/ar/library/content/60/1183/شعبة"
     },
     "يحيي":{
       verdict:"thiqa",
       qualification:{fr:"Fiable et autorité reconnue en critique du hadith selon al-Dhahabī.",ar:"ثقة مأمون من أئمة النقد والعلل كما ورد في السير.",en:"Trustworthy and a leading hadith critic according to al-Dhahabi."},
       bio:{fr:"Yaḥyā ibn Saʿīd al-Qaṭṭān : la chaîne identifiée pour ce hadith le relie à Shuʿba et à son élève Musaddad.",ar:"يحيى بن سعيد القطان، روى عن شعبة وروى عنه مسدد في هذا الإسناد.",en:"Yahya ibn Sa'id al-Qattan; in this identified chain he narrates from Shu'ba, with Musaddad narrating from him."},
       critique:"al-Dhahabī",reference:"Siyar Aʿlām al-Nubalāʾ, notice Yaḥyā al-Qaṭṭān",
       referenceUrl:"https://ar.wikisource.org/wiki/يحيى_بن_سعيد_القطان"
     },
     "مسدد":{
       verdict:"thiqa",
       qualification:{fr:"Fiable (thiqa), notamment selon al-Nasāʾī et Ibn Maʿīn, cités par al-Dhahabī.",ar:"ثقة، كما نقل الذهبي عن النسائي وابن معين.",en:"Trustworthy according to al-Nasa'i and Ibn Ma'in as quoted by al-Dhahabi."},
       bio:{fr:"Musaddad ibn Musarhad al-Baṣrī, enseignant d'al-Bukhārī et élève de Yaḥyā al-Qaṭṭān.",ar:"مسدد بن مسرهد البصري، من شيوخ البخاري، وروى عن يحيى القطان.",en:"Musaddad ibn Musarhad was a Basran transmitter, teacher of al-Bukhari and student of Yahya al-Qattan."},
       critique:"al-Nasāʾī, Ibn Maʿīn (rapportés par al-Dhahabī)",reference:"Siyar Aʿlām al-Nubalāʾ, notice Musaddad ibn Musarhad",
       referenceUrl:"https://ar.wikisource.org/wiki/سير_أعلام_النبلاء/مسدد_بن_مسرهد"
     }
   };
   if(Object.hasOwn(notices,nomAr))return notices[nomAr]!;
 }

 if(recueil==="sahih-bukhari"&&numero===1804&&nomAr==="ابي هريرة"){
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
