"use client";
import {useState} from "react";
import type {ChaineExterneResult,MaillonExterne} from "@/donnees/chaine-distante";
import styles from "./TableauIsnadExterne.module.css";

const dictionnaire={
 fr:{
  title:"Chaîne de transmission",summary:"Rapporteurs repérés dans le texte arabe de cette édition",
  complete:"Chaîne apparente extraite du texte",partial:"Chaîne partielle : extraction à vérifier",none:"Chaîne non exploitable pour cette référence",
  legend:"Cliquez sur un nom pour voir sa fiche descriptive et son niveau de documentation.",
  warning:"Ordre et découpage proposés automatiquement : ils peuvent comporter des erreurs. Une ressemblance de noms ne prouve pas l'identité d'un transmetteur.",
  link:"Consulter le texte arabe de la source",
  table:"Tableau de fiabilité des transmetteurs",
  pos:"Rang",name:"Transmetteur",role:"Catégorie / fiabilité",evidence:"Source et justification",
  open:"Afficher la fiche",fiche:"Fiche du transmetteur",bio:"Biographie et identité",
  noBio:"Aucune biographie individuelle n'est reliée avec certitude à ce nom dans la base consultée.",
  noVerdict:"Aucun jugement individuel sourcé n'est encore rattaché à ce nom pour cette chaîne. Cela ne signifie ni qu'il est fiable, ni qu'il est faible.",
  statusSource:"Source du hadith — hors jugement des transmetteurs",
  statusCompanion:"Compagnon — selon les sources indiquées",
  statusUnknown:"Non évalué",
  statusCompiler:"Compilateur (hors chaîne)",
  verdict:"Fiabilité et appréciations",critic:"Auteur de l'appréciation",reference:"Référence bibliographique",position:"Position dans ce parcours",
  prev:"Précédent",next:"Suivant",proof:"Mention du nom dans l'isnād arabe",
  incomplete:"La source peut renvoyer à une autre voie (« même isnād », « semblable »). Les maillons manquants ne sont pas inventés.",
  noChain:"Aucun ensemble de rapporteurs distincts n'a pu être extrait avec suffisamment d'indices. La référence originale reste accessible.",
  method:"Évaluation des personnes et authenticité du hadith sont deux questions distinctes."
 },
 ar:{
  title:"سلسلة الإسناد",summary:"الأسماء الملتقطة من النص العربي لهذه النسخة",
  complete:"سند ظاهر مستخرج آليًا",partial:"سند غير كامل يحتاج إلى مراجعة",none:"لم يمكن استخراج سند واضح لهذا المرجع",
  legend:"اختر اسم راوٍ لعرض بطاقته وحالة توثيقه.",
  warning:"تقسيم الأسماء وترتيبها آليان ويحتاجان إلى تدقيق. تشابه الأسماء لا يثبت اتحاد الأشخاص.",
  link:"مراجعة النص العربي في المصدر",
  table:"جدول الرواة وحالة التوثيق",
  pos:"الترتيب",name:"الراوي",role:"التصنيف / التوثيق",evidence:"المصدر والدليل",
  open:"عرض بطاقة الراوي",fiche:"بطاقة الراوي",bio:"الترجمة والتعيين",
  noBio:"لا توجد ترجمة موثقة تربط هذا الاسم بهذا الشخص على وجه اليقين في البيانات الحالية.",
  noVerdict:"لا يوجد حكم فردي مسند إلى مرجع لهذا الاسم في هذا الطريق. وليس معنى ذلك التضعيف أو التوثيق.",
  statusSource:"مصدر الحديث وليس حكمًا على راوٍ",statusCompanion:"صحابي وفق المصادر المرفقة",
  statusUnknown:"غير مقيّم",statusCompiler:"المصنّف (خارج السند)",
  verdict:"أقوال النقاد",critic:"صاحب القول",reference:"المصدر",position:"موضعه في هذه السلسلة",
  prev:"السابق",next:"التالي",proof:"الاسم كما التقط من السند",
  incomplete:"قد تُحيل النسخة إلى إسناد سابق بلفظ «بهذا الإسناد» أو «مثله»، ولا تُختلق الأسماء الناقصة.",
  noChain:"لم يمكن استخراج قائمة أسماء موثوقة بما يكفي، ويمكن مراجعة النص الأصلي.",
  method:"توثيق الراوي لا يكفي وحده للحكم بصحة الحديث."
 },
 en:{
  title:"Chain of transmission",summary:"Names detected in the Arabic text of this edition",
  complete:"Apparent chain extracted from source text",partial:"Partial chain: needs review",none:"No usable chain extracted",
  legend:"Select a name to view its record and the available reliability evidence.",
  warning:"Names and order were extracted mechanically and may contain errors. Similar names are not proof of a narrator's identity.",
  link:"Read original Arabic source",
  table:"Narrator reliability table",pos:"Order",name:"Narrator",role:"Category / reliability",evidence:"Evidence and source",
  open:"Open narrator profile",fiche:"Narrator profile",bio:"Biography and identity",
  noBio:"No independently verified biographical identity is linked to this name in the local data.",
  noVerdict:"No sourced individual judgment is linked to this name in this chain. It is not a claim that the narrator was either weak or trustworthy.",
  statusSource:"Hadith source; not a narrator grading",statusCompanion:"Companion according to cited scholarship",
  statusUnknown:"Not assessed",statusCompiler:"Compiler (outside chain)",
  verdict:"Reliability assessments",critic:"Author of judgment",reference:"Bibliographic reference",position:"Place in this chain",
  prev:"Previous",next:"Next",proof:"Name as extracted from the Arabic isnad",
  incomplete:"The edition may refer back to another route ('same chain'). Missing links are not invented.",
  noChain:"A defensible list of narrators could not be extracted; the original source remains available.",
  method:"Narrator reliability and hadith authenticity are distinct questions."
 }
} as const;
const compilerNames:Record<string,string>={"sahih-bukhari":"البخاري","sahih-muslim":"مسلم","sunan-abi-dawud":"أبو داود","jami-tirmidhi":"الترمذي","sunan-nasai":"النسائي","sunan-ibn-majah":"ابن ماجه","muwatta":"مالك"};
export default function TableauIsnadExterne({chaine,locale,recueil}:{
 chaine:ChaineExterneResult;locale:string;recueil:string;
}){
 const t=locale==="ar"?dictionnaire.ar:locale==="fr"?dictionnaire.fr:dictionnaire.en;
 const compiler=compilerNames[recueil];
 const maillons:MaillonExterne[]=chaine.maillons.length>0&&compiler?
  [...chaine.maillons,{id:"compiler",rang:chaine.maillons.length+1,nomAr:compiler,fragment:compiler,verdict:"compilateur"}]:chaine.maillons;
 const [selected,setSelected]=useState(Math.min(maillons.length-1,maillons.findIndex(x=>x.verdict!=="source")>=0?maillons.findIndex(x=>x.verdict!=="source"):0));
 const actuel=maillons[selected];
 const text=(v:{fr:string;ar:string;en:string})=>locale==="ar"?v.ar:locale==="fr"?v.fr:v.en;
 const statut=(m:MaillonExterne)=>m.verdict==="source"?t.statusSource:m.verdict==="compagnon"?t.statusCompanion:m.verdict==="compilateur"?t.statusCompiler:t.statusUnknown;
 const category=(m:MaillonExterne)=>m.verdict==="compagnon"?"compagnon":m.verdict==="source"?"source":m.verdict==="compilateur"?"compilateur":"non-evalue";
 return <section className={styles.root} aria-labelledby="chaine-externe-titre">
  <header className={styles.header}>
   <div><span className={styles.kicker}>◈ ISNĀD</span><h2 id="chaine-externe-titre">{t.title}</h2>
    <p>{t.summary} · {maillons.length>0?maillons.filter(m=>m.verdict!=="source"&&m.verdict!=="compilateur").length:0}</p></div>
   <span className={styles.state} data-state={chaine.etat}>
    {chaine.etat==="complete-apparente"?t.complete:chaine.etat==="partielle"?t.partial:t.none}
   </span>
  </header>
  <p className={styles.notice}>{chaine.etat==="indisponible"?t.noChain:t.legend} {t.warning}</p>
  {chaine.mentionRenvoi&&<p className={styles.renvoi}>{t.incomplete}</p>}
  {maillons.length>0&&<>
   <div className={styles.mainGrid}>
    <div className={styles.left}>
     <ol className={styles.chain}>
      {maillons.map((m,i)=><li key={m.id} className={styles.chainItem}>
       <button type="button" onClick={()=>setSelected(i)} aria-pressed={selected===i}
        aria-controls="fiche-rapport-externe" className={styles.node} data-role={category(m)}
        aria-label={t.open+" : "+m.nomAr}>
        <span className={styles.nodeName} dir="rtl" lang="ar">{m.nomAr}</span>
        <span className={styles.nodeStatus}>{statut(m)}</span>
       </button>
       {i<maillons.length-1&&<span className={styles.arrow} aria-hidden="true">→</span>}
      </li>)}
     </ol>
    </div>
    <aside id="fiche-rapport-externe" className={styles.profile} aria-live="polite">
     <h3>{t.fiche}</h3>
     <strong lang="ar" dir="rtl" className={styles.profileName}>{actuel?.nomAr}</strong>
     <span className={styles.category} data-role={actuel?category(actuel):undefined}>{actuel?statut(actuel):""}</span>
     <h4>{t.bio}</h4><p>{actuel?.bio?text(actuel.bio):t.noBio}</p>
     <h4>{t.verdict}</h4><p className={styles.verdict}>
      {actuel?.qualification?text(actuel.qualification):actuel?.verdict==="source"||actuel?.verdict==="compilateur"?statut(actuel):t.noVerdict}
     </p>
     {actuel?.critique&&<p><strong>{t.critic} :</strong> {actuel.critique}</p>}
     {actuel?.referenceUrl&&<a href={actuel.referenceUrl} target="_blank" rel="noopener noreferrer">
      {t.reference} : {actuel.reference} ↗</a>}
     <p className={styles.position}>{t.position} : {selected+1} / {maillons.length}</p>
     <div className={styles.buttons}>
      <button disabled={selected===0} type="button" onClick={()=>setSelected(selected-1)}>{t.prev}</button>
      <button disabled={selected===maillons.length-1} type="button" onClick={()=>setSelected(selected+1)}>{t.next}</button>
     </div>
    </aside>
   </div>
   <h3 className={styles.tableTitle}>{t.table}</h3>
   <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={t.table}>
    <table>
     <thead><tr><th scope="col">{t.pos}</th><th scope="col">{t.name}</th><th scope="col">{t.role}</th><th scope="col">{t.evidence}</th></tr></thead>
     <tbody>
      {maillons.map((m,i)=><tr key={m.id} data-active={selected===i}>
       <td>{i+1}</td>
       <td><button type="button" onClick={()=>setSelected(i)} className={styles.tableButton} aria-label={t.open+" : "+m.nomAr}>
        <bdi lang="ar" dir="rtl">{m.nomAr}</bdi> ↗
       </button></td>
       <td><span className={styles.category} data-role={category(m)}>{statut(m)}</span></td>
       <td>{m.referenceUrl?<a href={m.referenceUrl} target="_blank" rel="noopener noreferrer">{m.reference} ↗</a>
        :<a href={chaine.sourceArabe} target="_blank" rel="noopener noreferrer">{t.proof} ↗</a>}</td>
      </tr>)}
     </tbody>
    </table>
   </div>
  </>}
  <div className={styles.footer}>
   <p>{t.method}</p>
   <a href={chaine.sourceArabe} target="_blank" rel="noopener noreferrer">{t.link} ↗</a>
  </div>
 </section>;
}
