import type { Metadata } from "next";
import { corpus } from "@/donnees/corpus";
import { normaliser } from "@/donnees/recherche";

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { loadDetail, validDetailParams } from "@/donnees/fiche-distante";
import { fetchRemoteEdition, editionReferenceUrl } from "@/donnees/recherche-distante";
import { extraireChaineArabe } from "@/donnees/chaine-distante";
import TableauIsnadExterne from "@/composants/TableauIsnadExterne";
import ActionsRapport from "@/composants/ActionsRapport";
import styles from "./RapportExterne.module.css";

type Props={params:Promise<{locale:string;recueil:string;langue:string;numero:string}>};
const words={
 fr:{
  title:"Rapport documentaire",source:"Référence et provenance",text:"Texte du hadith",
  other:"Autre édition associée",grading:"Appréciations publiées par la source",
  chain:"Chaîne de transmission (isnād)",
  chainMissing:"Aucune chaîne structurée et vérifiée pour ce hadith n'est actuellement disponible dans le corpus de Milaghaiba.",
  chainNote:"Le texte arabe peut contenir des noms de rapporteurs, mais les identifier automatiquement et leur attribuer une fiabilité serait trompeur. Le rapport sera enrichi lorsque les biographies, les voies et les jugements seront documentés.",
  status:"État documentaire",notVerified:"Chaîne non documentée",noGrade:"Aucune appréciation fournie dans cette édition.",
  caution:"Ce rapport rassemble les références disponibles ; il n'atteste pas l'authenticité du hadith.",
  error:"Le texte est temporairement indisponible chez le fournisseur. La référence originale reste consultable.",
  sourceLink:"Voir le fichier original du fournisseur (JSON)",number:"Numéro du hadith",location:"Livre / rang",
  edition:"Édition",aligned:"Références concordantes dans les éditions associées",
  unaligned:"Aucune correspondance entre éditions n'a été vérifiée",reader:"Retour à la fiche du hadith"
 },
 ar:{
  title:"التقرير التوثيقي",source:"المصدر والتخريج",text:"متن الحديث",other:"نسخة أخرى مرتبطة",
  grading:"الأحكام المنقولة من النسخة",chain:"سند الحديث",
  chainMissing:"لا يوجد لهذا الحديث سند منظّم محقق في قاعدة بيانات الملة الغائبة.",
  chainNote:"قد يشتمل النص العربي على رواة، لكن لا ينبغي استنتاج هوياتهم أو أحكامهم آليًا. يلزم توثيق الرجال والطرق وأقوال النقاد قبل عرض السند تفاعليًا.",
  status:"حالة التوثيق",notVerified:"لم يوثّق السند",noGrade:"لم ترد أحكام في النسخة.",
  caution:"يعرض التقرير المراجع المتاحة، ولا يثبت صحة الحديث.",
  error:"تعذر تحميل النص من المصدر حاليًا. يبقى رابط المرجع الأصلي متاحًا.",
  sourceLink:"المصدر الأصلي (ملف JSON)",number:"رقم الحديث",location:"الكتاب / الموضع",
  edition:"النسخة",aligned:"توافقت المراجع في النسختين",
  unaligned:"لم يتحقق تطابق النسخ",reader:"العودة إلى صفحة الحديث"
 },
 en:{
  title:"Documentary report",source:"Edition and provenance",text:"Hadith text",other:"Linked edition",
  grading:"Grades published by the source",chain:"Chain of transmission (isnad)",
  chainMissing:"No verified structured chain for this hadith is currently available in Milaghaiba's research corpus.",
  chainNote:"The Arabic text may mention narrators. Automatically identifying and grading them would be misleading. The chain will be enriched when biographies, routes and scholarly assessments are documented.",
  status:"Documentation status",notVerified:"Chain not documented",noGrade:"No grading supplied in this edition.",
  caution:"This report presents available references; it does not certify the hadith's authenticity.",
  error:"Upstream text is temporarily unavailable. The original source link remains available.",
  sourceLink:"Original source file (JSON)",number:"Hadith number",location:"Book / position",
  edition:"Edition",aligned:"References aligned between editions",
  unaligned:"No verified cross-edition match",reader:"Back to hadith reading"
 }
} as const;
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,recueil,langue,numero}=await params;
 const valid=validDetailParams(recueil,langue,numero);
 const t=locale==="ar"?words.ar:locale==="fr"?words.fr:words.en;
 return {title:valid?t.title+" · "+valid.collection.nom+" n° "+numero+" — Milaghaiba":t.title+" — Milaghaiba",
  robots:{index:false,follow:true}};
}
export default async function RapportSource({params}:Props){
 const {locale,recueil,langue,numero}=await params;
 setRequestLocale(locale);
 const validated=validDetailParams(recueil,langue,numero);
 if(!validated)notFound();
 const t=locale==="ar"?words.ar:locale==="fr"?words.fr:words.en;
 const {collection,number}=validated;
 const back="/source/"+recueil+"/"+langue+"/"+numero;
 let detail:Awaited<ReturnType<typeof loadDetail>>=null;
 try{detail=await loadDetail(recueil,langue,numero);}catch{/* Rapport de référence accessible même sans source distante. */}
 const originalUrl=detail?.sourceUrl??"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/"+langue+"-"+collection.key+"/"+number+".min.json";
 // Le rapport doit lire le texte de l'édition ARABE, même si la fiche consultée est en français.
 // Refus de relier deux numéros tant que livre et rang ne concordent pas.
 let texteArabe: string | null = null;
 if(detail){
   if(langue==="ara")texteArabe=detail.hadith.text;
   else if(detail.other?.language==="ara")texteArabe=detail.other.hadith.text;
   else try{
     const editionAr=await fetchRemoteEdition(collection,"ara",number);
     const candidat=editionAr.hadiths?.find(h=>h.hadithnumber===number);
     const refCourante=detail.hadith.reference;
     if(candidat?.reference&&refCourante &&
       candidat.reference.book===refCourante.book &&
       candidat.reference.hadith===refCourante.hadith)texteArabe=candidat.text;
   }catch{/* Ne jamais construire une chaîne à partir d'une autre édition non vérifiée. */}
 }
 const sourceArabe=editionReferenceUrl(collection.key,"ara",number);
 const chaine=extraireChaineArabe(texteArabe??"",recueil,number,sourceArabe);
 const texteNormalise=normaliser(texteArabe??"");
 // Recoupement strict : même recueil, même numéro et un fragment du matn arabe
 // suffisamment long. N'assimile jamais deux hadiths sur leur seul numéro.
 const rapportLocal=texteNormalise.length>=35?corpus.hadiths.find(h=>
   h.occurrences.some(o=>o.ouvrage===recueil&&o.numero===String(number))&&
   (()=>{const original=normaliser(h.texteAr);const a=original.slice(0,Math.min(50,original.length));return a.length>=35&&(texteNormalise.includes(a)||original.includes(texteNormalise.slice(0,50)));})()
 ):undefined;
 const ref=detail?.hadith.reference;
 const grades=detail?.hadith.grades?.filter(g=>g&&typeof g.name==="string"&&typeof g.grade==="string")??[];
 const texts=detail?[
   {language:langue,text:detail.hadith.text,main:true},
   ...(detail.other?[{language:detail.other.language,text:detail.other.hadith.text,main:false}]:[])
 ]:[];
 return <main id="contenu" tabIndex={-1} className={styles.root}>
  <ActionsRapport returnHref={back} print/>
  <header className={styles.hero}>
   <span className={styles.kicker}>✦ MILAGHAIBA · {t.title}</span>
   <h1>{collection.nom}</h1>
   <p>{t.number} <bdi dir="ltr"> {number}</bdi></p>
  </header>
  <section className={styles.stats} aria-label={t.source}>
   <div><span>{t.number}</span><strong><bdi dir="ltr">{number}</bdi></strong></div>
   <div><span>{t.location}</span><strong><bdi dir="ltr">{ref?.book??"—"} / {ref?.hadith??"—"}</bdi></strong></div>
   <div><span>{t.edition}</span><strong><bdi dir="ltr">{langue+"-"+collection.key}</bdi></strong></div>
   <div><span>{t.status}</span><strong className={styles.status}>{chaine.maillons.length>0?chaine.etat==="partielle"?t.notVerified:t.chain:t.notVerified}</strong></div>
  </section>
  {rapportLocal&&<section className={styles.panel} aria-label="Rapport enrichi du corpus">
    <h2>{locale==="ar"?"تقرير الإسناد المفصّل":locale==="fr"?"Rapport enrichi disponible":"Enriched chain report available"}</h2>
    <p>{locale==="fr"?"Un dossier local correspondant à cette référence et à ce texte arabe contient des voies et fiches documentaires supplémentaires.":locale==="ar"?"توجد لهذا المرجع ونصه العربي دراسة محلية تتضمن طرقاً وتراجم إضافية.":"A matching local dossier contains additional transmission routes and narrator records."}</p>
    <Link href={`/rapport/${rapportLocal.id}`} className={styles.source}>{locale==="fr"?"Ouvrir le rapport détaillé avec biographies et voies":locale==="ar"?"فتح التقرير المفصل":"Open detailed narrator report"} ↗</Link>
  </section>}
  <TableauIsnadExterne chaine={chaine} locale={locale} recueil={recueil}/>
  <div className={styles.layout}>
   <div className={styles.left}>
    <section className={styles.panel}>
     <h2>۞ {t.text}</h2>
     {texts.length===0?<p>{t.error}</p>:texts.map(entry=>
       <article className={styles.passage} key={entry.language}>
        {!entry.main&&<h3>{t.other} · {detail?.counterpartStatus==="matched"?t.aligned:t.unaligned}</h3>}
        <p className={entry.language==="ara"?styles.arabic:styles.text}
           lang={entry.language==="ara"?"ar":entry.language==="fra"?"fr":entry.language==="eng"?"en":locale}
           dir={entry.language==="ara"||entry.language==="urd"?"rtl":"ltr"}>{entry.text}</p>
       </article>)}
    </section>
    <section className={styles.panel}>
     <h2>◈ {t.grading}</h2>
     {grades.length>0?<ul className={styles.grades}>{grades.map((g,i)=>
       <li key={i}><strong>{g.name}</strong> · {g.grade}</li>)}</ul>:<p>{t.noGrade}</p>}
    </section>
   </div>
   <aside className={styles.right}>
    <section className={styles.panel}>
     <h2>♧ {t.chain}</h2>
     <p className={styles.notice}>{chaine.maillons.length===0?t.chainMissing:chaine.etat==="partielle"?t.chainNote:t.caution}</p>
     <p><a className={styles.source} href={sourceArabe} target="_blank" rel="noopener noreferrer">{t.sourceLink} · العربية ↗</a></p>
    </section>
    <section className={styles.panel}>
     <h2>◈ {t.source}</h2>
     <p>{collection.nom} · <bdi dir="ltr">{langue+"-"+collection.key}</bdi> · hadith-api@1</p>
     <a className={styles.source} href={originalUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink} ↗</a>
    </section>
   </aside>
  </div>
  <p className={styles.warning}>{t.caution}</p>
  <ActionsRapport returnHref={back} print/>
  <footer className={styles.footer}><Link href={back}>← {t.reader}</Link></footer>
 </main>;
}
