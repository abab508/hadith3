import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { loadDetail,validDetailParams } from "@/donnees/fiche-distante";
import styles from "./FicheDistante.module.css";

type Parameters={locale:string;recueil:string;langue:string;numero:string};
type Props={params:Promise<Parameters>};

const translation={
 fr:{
  book:"Recueil de hadiths",back:"Retour à la recherche",sources:"Bibliothèque des sources",
  edition:"Édition consultée",published:"Référence dans le livre",number:"Hadith n°",
  arabic:"Texte arabe",french:"Traduction française",english:"Traduction anglaise",
  text:"Texte du hadith",other:"Autre édition associée",matched:"Références concordantes : numéro, livre et rang identiques dans les deux éditions",
  noPair:"Autre édition non disponible ou correspondance non vérifiée pour cette référence.",
  grading:"Appréciations publiées dans cette édition",noGrade:"Aucune appréciation particulière fournie dans le fichier.",
  caution:"Ces textes et éventuelles appréciations sont repris d'une édition externe. La concordance des références ne certifie ni la traduction, ni la continuité de l’isnād, ni l’authenticité du hadith.",
  origin:"Source originale (fichier JSON technique)",originNote:"Le JSON sert à contrôler les données brutes ; ce n'est pas une page destinée à la lecture.",
  error:"La source distante ne répond pas pour le moment. Réessayez plus tard ou consultez le fichier original.",
  arabicNote:"Le texte arabe peut contenir la formulation de l’isnād dans cette édition, sans identification biographique automatique.",
  editionLang:"Langue de l'édition",provenance:"Provenance",notAvailable:"Aucun texte de ce numéro dans l'édition sélectionnée."
 },
 ar:{
  book:"كتاب الحديث",back:"العودة إلى البحث",sources:"مكتبة المصادر",
  edition:"النسخة المعروضة",published:"المرجع داخل الكتاب",number:"حديث رقم",
  arabic:"النص العربي",french:"الترجمة الفرنسية",english:"الترجمة الإنجليزية",
  text:"نص الحديث",other:"نسخة أخرى مرتبطة",matched:"تطابق المرجع في الرقم والكتاب والموضع في كلتا النسختين",
  noPair:"لا تتوفر النسخة الأخرى أو لم يتم التحقق من تطابق المرجع.",
  grading:"أحكام منقولة كما وردت في النسخة",noGrade:"لا توجد أحكام خاصة مرفقة في الملف.",
  caution:"هذه نصوص من نسخة خارجية. تطابق المراجع لا يُعد توثيقًا للترجمة أو اتصال السند أو صحة الحديث.",
  origin:"المصدر الأصلي (ملف JSON تقني)",originNote:"ملف JSON لعرض البيانات الأصلية، وليس صفحة للقراءة.",
  error:"المصدر الخارجي غير متاح حاليًا، حاول لاحقًا أو افتح الملف الأصلي.",
  arabicNote:"قد تتضمن النسخة العربية سندًا، دون تحقق آلي من تراجم رواته.",
  editionLang:"لغة النسخة",provenance:"مصدر البيانات",notAvailable:"لا يوجد نص لهذا الرقم في النسخة المحددة."
 },
 en:{
  book:"Hadith collection",back:"Back to search",sources:"Source library",
  edition:"Edition",published:"Reference within book",number:"Hadith no.",
  arabic:"Arabic text",french:"French translation",english:"English translation",
  text:"Hadith text",other:"Linked edition",matched:"References aligned: identical number, book and in-book position",
  noPair:"Another edition is unavailable or reference alignment is unverified.",
  grading:"Assessments quoted from this edition",noGrade:"No grade supplied in this edition.",
  caution:"The text and any assessments come from an external edition. Matching reference numbers do not certify the translation, chain or authenticity.",
  origin:"Original source (technical JSON file)",originNote:"Raw JSON is for inspecting source data, not for normal reading.",
  error:"The remote source is temporarily unavailable. Try again later or open the original file.",
  arabicNote:"The Arabic text may include a chain of transmission, without automatic biographical verification.",
  editionLang:"Edition language",provenance:"Data provenance",notAvailable:"No text for this number in the chosen edition."
 }
} as const;
const langNames:Record<string,string>={ara:"العربية",fra:"Français",eng:"English",urd:"اردو",tur:"Türkçe",ind:"Bahasa Indonesia"};

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {recueil,langue,numero}=await params;
 const validated=validDetailParams(recueil,langue,numero);
 return {title:validated?validated.collection.nom+" · n° "+numero+" — Milaghaiba":"Hadith — Milaghaiba",
  robots:{index:false,follow:true}};
}
export default async function FicheDistante({params}:Props){
 const {locale,recueil,langue,numero}=await params;
 setRequestLocale(locale);
 const validated=validDetailParams(recueil,langue,numero);
 if(!validated)notFound();
 const t=locale==="ar"?translation.ar:locale==="fr"?translation.fr:translation.en;
 const {collection,number}=validated;
 const sourceUrl="https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/"+langue+"-"+collection.key+"/"+number+".min.json";
 let data:Awaited<ReturnType<typeof loadDetail>>=null,failed=false;
 try{data=await loadDetail(recueil,langue,numero);}catch{failed=true;}
 const langLabel=langNames[langue]??langue;
 const source=data?.sourceUrl??sourceUrl;
 const paragraphs=data?[
  {language:langue,text:data.hadith.text,secondary:false},
  ...(data.other?[{language:data.other.language,text:data.other.hadith.text,secondary:true}]:[])
 ]:[];
 const labelFor=(language:string)=>language==="ara"?t.arabic:language==="fra"?t.french:language==="eng"?t.english:t.text;
 return <main className={styles.root} id="contenu" tabIndex={-1}>
  <div className={styles.breadcrumb}>
   <Link href="/recherche">← {t.back}</Link><span aria-hidden="true">✦</span>
   <Link href="/sources">{t.sources}</Link>
  </div>
  <header className={styles.hero}>
   <span className={styles.kicker}>✧ {t.book} · {langLabel}</span>
   <h1>{collection.nom}</h1>
   <div className={styles.badges}>
    <span className={styles.number}>{t.number} {number}</span>
    <span>{t.editionLang}: {langLabel}</span>
   </div>
  </header>
  {failed||!data?(
   <section className={styles.error} role="status">
    <h2>{failed?t.error:t.notAvailable}</h2>
    <a href={source} target="_blank" rel="noopener noreferrer">{t.origin} ↗</a>
   </section>
  ):(
   <>
    <section className={styles.summary} aria-label={t.published}>
     <div><span>{t.published}</span><strong>{data.hadith.reference?.book??"—"} / {data.hadith.reference?.hadith??"—"}</strong></div>
     <div><span>{t.edition}</span><strong><bdi dir="ltr">{langue+"-"+collection.key}</bdi></strong></div>
     <div><span>{t.provenance}</span><strong><bdi dir="ltr">hadith-api@1</bdi></strong></div>
    </section>
    <div className={styles.reading}>
     {paragraphs.map(({language,text,secondary})=>(
      <article className={secondary?styles.secondary:styles.primary} key={language}>
       <header className={styles.articleHeader}><span aria-hidden="true">۞</span>
        <h2>{secondary?t.other+" — "+labelFor(language):labelFor(language)}</h2>
       </header>
       <p className={language==="ara"?styles.arabic:styles.prose}
          lang={language==="ara"?"ar":language==="fra"?"fr":language==="eng"?"en":language==="urd"?"ur":locale}
          dir={language==="ara"||language==="urd"?"rtl":"ltr"}>{text}</p>
       {secondary&&<p className={styles.match}><span aria-hidden="true">✓ </span>{t.matched}</p>}
      </article>
     ))}
    </div>
    {!data.other&&["ara","fra"].includes(langue)&&<p className={styles.caution}>{t.noPair}</p>}
    {Array.isArray(data.hadith.grades)&&data.hadith.grades.length>0&&(
     <section className={styles.grades}><h2>{t.grading}</h2>
      <ul>{data.hadith.grades.filter(g=>g&&typeof g.name==="string"&&typeof g.grade==="string")
        .map((g,i)=><li key={i}><strong>{g.name}</strong><span>{g.grade}</span></li>)}</ul>
     </section>
    )}
    <p className={styles.disclaimer}>{t.caution} {langue==="ara"&&t.arabicNote}</p>
   </>
  )}
  <footer className={styles.footer}>
   <div><h2>{t.provenance}</h2><p>{t.originNote}</p></div>
   <a href={source} target="_blank" rel="noopener noreferrer">{t.origin} ↗</a>
  </footer>
 </main>;
}
