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
  statusUnknown:"Non évalué",statusThiqa:"Fiable (thiqa), avec référence",statusDiv:"Avis divergents — voir les sources",
  completeName:"Identité documentée",related:"Relations dans ce hadith",master:"Maître de cette chaîne",student:"Élève de cette chaîne",
  masters:"Autres maîtres mentionnés dans les sources",students:"Autres élèves mentionnés dans les sources",
  assessments:"Avis des critiques",limited:"Exemples documentés, liste non exhaustive.",
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
  statusUnknown:"غير مقيّم",statusThiqa:"ثقة، مع المصدر",statusDiv:"مختلف فيه — راجع أقوال النقاد",
  completeName:"الاسم المعين",related:"العلاقات في هذا السند",master:"شيخه في هذا السند",student:"تلميذه في هذا السند",
  masters:"شيوخ آخرون مذكورون في المصادر",students:"تلاميذ آخرون مذكورون في المصادر",
  assessments:"أقوال النقاد",limited:"أمثلة موثقة وليست قائمة شاملة.",statusCompiler:"المصنّف (خارج السند)",
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
  statusUnknown:"Not assessed",statusThiqa:"Trustworthy (thiqa), with source",statusDiv:"Disputed — see critic statements",
  completeName:"Documented identity",related:"Relations in this chain",master:"Teacher in this chain",student:"Student in this chain",
  masters:"Other teachers mentioned in sources",students:"Other students mentioned in sources",
  assessments:"Critic statements",limited:"Documented examples, not a complete list.",statusCompiler:"Compiler (outside chain)",
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
 const [voirTableau,setVoirTableau]=useState(false);
 const [onglet,setOnglet]=useState<"bio"|"fiabilite">("bio");
 const [bulleOuverte,setBulleOuverte]=useState(false);
 const documentes=maillons.filter(m=>m.verdict!=="source"&&m.verdict!=="compilateur"&&(m.jugements?.length||m.referenceUrl||m.reference)).length;
 const aVerifier=maillons.filter(m=>m.verdict!=="source"&&m.verdict!=="compilateur").length-documentes;
 const actuel=maillons[selected];
 const text=(v:{fr:string;ar:string;en:string})=>locale==="ar"?v.ar:locale==="fr"?v.fr:v.en;
 const statut=(m:MaillonExterne)=>m.verdict==="source"?t.statusSource:m.verdict==="compagnon"?t.statusCompanion:m.verdict==="compilateur"?t.statusCompiler:m.verdict==="thiqa"?t.statusThiqa:m.verdict==="divergent"?t.statusDiv:t.statusUnknown;
 const category=(m:MaillonExterne)=>m.verdict==="compagnon"?"compagnon":m.verdict==="source"?"source":m.verdict==="compilateur"?"compilateur":m.verdict==="thiqa"?"thiqa":m.verdict==="divergent"?"divergent":"non-evalue";
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
       <button type="button" onClick={()=>{setSelected(i);setBulleOuverte(true);}} aria-pressed={selected===i}
        aria-controls="fiche-rapport-externe" className={styles.node} data-role={category(m)}
        aria-label={t.open+" : "+m.nomAr}>
        <span className={styles.nodeName} dir="rtl" lang="ar">{m.nomCompletAr??m.nomAr}</span>
        <span className={styles.nodeStatus}>{statut(m)}</span>
       </button>
       {i<maillons.length-1&&<span className={styles.arrow} aria-hidden="true">→</span>}
      </li>)}
     </ol>
    </div>
    {bulleOuverte&&actuel&&<div className={styles.identityOverlay} role="presentation" onClick={()=>setBulleOuverte(false)}>
      <section className={styles.identityBubble} role="dialog" aria-modal="true" aria-label={locale==="fr"?"Identité du transmetteur":locale==="ar"?"هوية الراوي":"Narrator identity"} onClick={e=>e.stopPropagation()}>
       <div className={styles.bubbleHead}>
        <strong>{locale==="fr"?"Fiche d'identification":locale==="ar"?"بطاقة التعريف":"Identity record"}</strong>
        <button type="button" onClick={()=>setBulleOuverte(false)} aria-label={locale==="fr"?"Fermer":locale==="ar"?"إغلاق":"Close"}>×</button>
       </div>
       <h3 lang="ar" dir="rtl" className={styles.bubbleName}>{actuel.nomCompletAr??actuel.nomAr}</h3>
       {actuel.nomLatin&&<p>{actuel.nomLatin}</p>}
       <span className={styles.category} data-role={category(actuel)}>{statut(actuel)}</span>
       <h4>{locale==="fr"?"Filiation et identité":locale==="ar"?"النسب والهوية":"Lineage and identity"}</h4>
       <p>{actuel.nomCompletAr?
         (locale==="fr"?"Nom complet documenté ci-dessus. Les liens familiaux ne sont pas déduits automatiquement du nom.":locale==="ar"?"الاسم الكامل موثق أعلاه، ولا تستنتج القرابة تلقائياً من تشابه الأسماء.":"Full documented name above. Family relations are not inferred from names."):
         (locale==="fr"?"Identité complète non confirmée : ne pas inventer d'arbre familial.":locale==="ar"?"لم تثبت الهوية الكاملة؛ لا تنشأ شجرة نسب مفترضة.":"Full identity unconfirmed; no family tree is invented.")}</p>
       <h4>{locale==="fr"?"Arbre de transmission (maîtres et élèves)":locale==="ar"?"شجرة الرواية (الشيوخ والتلاميذ)":"Transmission network (teachers and students)"}</h4>
       <div className={styles.bubbleTree}>
        <div><small>{locale==="fr"?"Maître dans cette chaîne":locale==="ar"?"شيخه في هذا السند":"Teacher in this chain"}</small><span>{selected>0?(maillons[selected-1]?.nomCompletAr??maillons[selected-1]?.nomAr):"—"}</span></div>
        <div className={styles.bubblePerson} lang="ar" dir="rtl">{actuel.nomCompletAr??actuel.nomAr}</div>
        <div><small>{locale==="fr"?"Élève dans cette chaîne":locale==="ar"?"تلميذه في هذا السند":"Student in this chain"}</small><span>{selected<maillons.length-1?(maillons[selected+1]?.nomCompletAr??maillons[selected+1]?.nomAr):"—"}</span></div>
       </div>
       <p className={styles.bubbleCaution}>{locale==="fr"?"Cette chaîne est extraite automatiquement : les relations nécessitent une vérification dans les sources.":locale==="ar"?"السند مستخرج آلياً وتحتاج العلاقات إلى التوثيق من المصادر.":"This chain is extracted automatically; relationships require source verification."}</p>
       {actuel.bio&&<p>{text(actuel.bio)}</p>}
       {actuel.referenceUrl&&<a href={actuel.referenceUrl} target="_blank" rel="noopener noreferrer">{locale==="fr"?"Source biographique":locale==="ar"?"المصدر":"Biographical source"} ↗</a>}
       <div className={styles.bubbleActions}>
        <button type="button" onClick={()=>{setOnglet("bio");setBulleOuverte(false);}}>{locale==="fr"?"Voir la biographie":locale==="ar"?"عرض الترجمة":"View biography"}</button>
        <button type="button" onClick={()=>{setOnglet("fiabilite");setBulleOuverte(false);}}>{locale==="fr"?"Voir le rapport de fiabilité":locale==="ar"?"عرض الجرح والتعديل":"View reliability report"}</button>
       </div>
      </section>
     </div>}
    <aside id="fiche-rapport-externe" className={styles.profile} aria-live="polite">
     <h3>{t.fiche}</h3>
     <strong lang="ar" dir="rtl" className={styles.profileName}>{actuel?.nomCompletAr??actuel?.nomAr}</strong>
     {actuel?.nomLatin&&<span className={styles.profileLatin} lang="ar-Latn" dir="ltr">{actuel.nomLatin}</span>}
     <span className={styles.category} data-role={actuel?category(actuel):undefined}>{actuel?statut(actuel):""}</span>
     <div className={styles.tabs} role="tablist" aria-label={t.fiche}>
      <button type="button" role="tab" aria-selected={onglet==="bio"} onClick={()=>setOnglet("bio")}>{locale==="fr"?"Biographie":locale==="ar"?"الترجمة":"Biography"}</button>
      <button type="button" role="tab" aria-selected={onglet==="fiabilite"} onClick={()=>setOnglet("fiabilite")}>{locale==="fr"?"Fiabilité":locale==="ar"?"الجرح والتعديل":"Reliability"}</button>
     </div>
     {onglet==="bio"&&<div role="tabpanel"><h4>{t.bio}</h4><p>{actuel?.bio?text(actuel.bio):t.noBio}</p>
     {actuel&&maillons.length>0&&<section className={styles.relations}>
      <h4>{t.related}</h4>
      {selected>0&&<button type="button" onClick={()=>setSelected(selected-1)} className={styles.related}>
       <small>{t.master}</small> <bdi lang="ar" dir="rtl">{maillons[selected-1]?.nomCompletAr??maillons[selected-1]?.nomAr}</bdi> ↗
      </button>}
      {selected<maillons.length-1&&<button type="button" onClick={()=>setSelected(selected+1)} className={styles.related}>
       <small>{t.student}</small> <bdi lang="ar" dir="rtl">{maillons[selected+1]?.nomCompletAr??maillons[selected+1]?.nomAr}</bdi> ↗
      </button>}
      {actuel.maitres&&actuel.maitres.length>0&&<div className={styles.otherRelated}>
       <strong>{t.masters}</strong><ul>{actuel.maitres.map(n=><li key={n}>{n}</li>)}</ul>
      </div>}
      {actuel.eleves&&actuel.eleves.length>0&&<div className={styles.otherRelated}>
       <strong>{t.students}</strong><ul>{actuel.eleves.map(n=><li key={n}>{n}</li>)}</ul>
      </div>}
      {(actuel.maitres||actuel.eleves)&&<p className={styles.limitation}>{t.limited}</p>}
     </section>}
     </div>}
     {onglet==="fiabilite"&&<div role="tabpanel">
          <h4>{t.verdict}</h4><p className={styles.verdict}>
      {actuel?.qualification?text(actuel.qualification):actuel?.verdict==="source"||actuel?.verdict==="compilateur"?statut(actuel):t.noVerdict}
     </p>
     {actuel?.jugements&&actuel.jugements.length>0&&<section className={styles.assessments}>
      <h4>{t.assessments}</h4>
      <ul>{actuel.jugements.map((j,i)=><li key={i}>
       <strong>{j.auteur}</strong>
       <p>{text(j.appreciation)}</p>
       <a href={j.url} target="_blank" rel="noopener noreferrer">{j.ouvrage} ↗</a>
      </li>)}</ul>
     </section>}
          {actuel?.critique&&<p><strong>{t.critic} :</strong> {actuel.critique}</p>}
     {actuel?.referenceUrl?<a href={actuel.referenceUrl} target="_blank" rel="noopener noreferrer">{t.reference} : {actuel.reference} ↗</a>:actuel?.reference?<p><strong>{t.reference} :</strong> {actuel.reference}</p>:null}
     </div>}
     <details className={styles.documentarySources}>
      <summary>{locale==="fr"?"Références et preuves documentaires":locale==="ar"?"المراجع والأدلة":"Documentary sources and evidence"}</summary>
      <ul>
       {actuel?.jugements?.map((j,i)=><li key={i}>
        <strong>{j.auteur} — {j.ouvrage}</strong>{" "}
        <a href={j.url} target="_blank" rel="noopener noreferrer">{locale==="fr"?"Consulter la référence":locale==="ar"?"عرض المرجع":"Read source"} ↗</a>
       </li>)}
       {actuel?.referenceUrl?<li><strong>{actuel.reference}</strong>{" "}<a href={actuel.referenceUrl} target="_blank" rel="noopener noreferrer">{locale==="fr"?"Voir la notice":locale==="ar"?"عرض الترجمة":"Read record"} ↗</a></li>:actuel?.reference?<li><strong>{actuel.reference}</strong> — {locale==="fr"?"Référence locale à vérifier":locale==="ar"?"مرجع محلي يحتاج مراجعة":"Local reference pending verification"}</li>:null}
       <li><a href={chaine.sourceArabe} target="_blank" rel="noopener noreferrer">{locale==="fr"?"Texte arabe original du hadith (preuve du nom, pas de sa fiabilité)":locale==="ar"?"متن الحديث العربي (دليل الاسم لا التوثيق)":"Original Arabic narration (name evidence, not reliability)"} ↗</a></li>
      </ul>
      {!actuel?.reference&&!actuel?.referenceUrl&&!actuel?.jugements?.length&&<p>{locale==="fr"?"Aucune référence biographique vérifiée pour cette identité dans les données actuelles.":locale==="ar"?"لا يوجد مرجع ترجمة موثق لهذه الهوية في البيانات الحالية.":"No verified biographical reference for this identity in current data."}</p>}
     </details>
     <p className={styles.position}>{t.position} : {selected+1} / {maillons.length}</p>
     <div className={styles.buttons}>
      <button disabled={selected===0} type="button" onClick={()=>setSelected(selected-1)}>{t.prev}</button>
      <button disabled={selected===maillons.length-1} type="button" onClick={()=>setSelected(selected+1)}>{t.next}</button>
     </div>
    </aside>
   </div>
   <div className={styles.tableTitle}>
    <h3>{t.table}</h3>
    <p>{locale==="fr"?"Références reliées : "+documentes+" · À vérifier : "+aVerifier:locale==="ar"?"مراجع مرتبطة: "+documentes+" · تحتاج مراجعة: "+aVerifier:"Linked references: "+documentes+" · To verify: "+aVerifier}</p>
    <button type="button" aria-expanded={voirTableau} onClick={()=>setVoirTableau(!voirTableau)}>
     {voirTableau?(locale==="fr"?"Masquer le tableau":locale==="ar"?"إخفاء الجدول":"Hide table"):(locale==="fr"?"Voir les détails":locale==="ar"?"عرض التفاصيل":"Show details")}
    </button>
   </div>
   {voirTableau&&<div className={styles.tableWrap} tabIndex={0} role="region" aria-label={t.table}>
    <table>
     <thead><tr><th scope="col">{t.pos}</th><th scope="col">{t.name}</th><th scope="col">{t.role}</th><th scope="col">{t.evidence}</th></tr></thead>
     <tbody>
      {maillons.map((m,i)=><tr key={m.id} data-active={selected===i}>
       <td>{i+1}</td>
       <td><button type="button" onClick={()=>setSelected(i)} className={styles.tableButton} aria-label={t.open+" : "+m.nomAr}>
        <bdi lang="ar" dir="rtl">{m.nomCompletAr??m.nomAr}</bdi> ↗
       </button></td>
       <td><span className={styles.category} data-role={category(m)}>{statut(m)}</span></td>
       <td>{m.referenceUrl?<a href={m.referenceUrl} target="_blank" rel="noopener noreferrer">{m.reference} ↗</a>:m.reference?<span>{m.reference}</span>
        :<a href={chaine.sourceArabe} target="_blank" rel="noopener noreferrer">{t.proof} ↗</a>}</td>
      </tr>)}
     </tbody>
    </table>
   </div>}
  </>}
  <div className={styles.footer}>
   <p>{t.method}</p>
   <a href={chaine.sourceArabe} target="_blank" rel="noopener noreferrer">{t.link} ↗</a>
  </div>
 </section>;
}
