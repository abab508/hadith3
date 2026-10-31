import { remoteLanguage,remoteSearch, EXTERNAL_COLLECTIONS } from "@/donnees/recherche-distante";
import { Link } from "@/i18n/navigation";
import { libellesRapport } from "@/donnees/libelles-rapport";
import styles from "./ResultatsDistants.module.css";

const fr={
label:"Recherche dans les recueils en ligne",source:"Source distante : Hadith API @1",wait:"Interrogation des recueils en cours…",
found:(n:number,books:number)=>n+" résultat(s) dans "+books+" recueil(s) interrogé(s)",
missing:"Recherche incomplète : certaines éditions n'ont pas répondu ou ne proposent pas cette langue.",
empty:"Aucune correspondance trouvée dans les éditions disponibles. Essayez l'arabe ou sélectionnez un recueil.",
open:"Ouvrir la fiche complète du hadith",download:"Télécharger les CSV et consulter les sources",next:"Suivant",prev:"Précédent",
page:(n:number,m:number)=>"Page "+n+" / "+m,none:"La source distante est momentanément inaccessible. Les résultats locaux restent disponibles.",
notice:"Les textes et traductions viennent de sources externes ; leur présence ne constitue pas une vérification scientifique du hadith ni de son isnād.",
language:"Langue interrogée",grade:"Appréciation fournie par l'édition, attribuée à son auteur",
limited:"Cette recherche couvre les éditions accessibles depuis le fournisseur externe ; les biographies et isnāds détaillés ne sont pas systématiquement fournis.",
indexed:"Index léger activé · seules les fiches visibles sont téléchargées",missingText:"Texte momentanément indisponible chez le fournisseur. La référence reste consultable.",match:"Référence arabe et française alignée (même numéro, même livre et même rang)",onlyNumber:"Même numéro global, mais livre ou rang différent : correspondance non confirmée",noMatch:"Aucune référence correspondante vérifiée",arabicRef:"Voir le texte arabe",frenchRef:"Voir la traduction française"
};
const ar={label:"البحث في كتب الحديث على الإنترنت",source:"المصدر الخارجي: Hadith API @1",wait:"جارٍ البحث في الكتب...",
found:(n:number,books:number)=>n+" نتيجة في "+books+" مجموعة",missing:"البحث غير مكتمل: بعض النسخ غير متاحة أو لم تستجب.",empty:"لم تظهر نتائج في النسخ المتاحة. جرّب كلمة أخرى أو اختر كتابًا.",open:"فتح بطاقة الحديث المنسّقة",download:"تنزيل CSV وعرض المصادر",next:"التالي",prev:"السابق",page:(n:number,m:number)=>"صفحة "+n+" / "+m,none:"المصدر الخارجي غير متاح حاليًا، والبحث المحلي لا يزال يعمل.",notice:"هذه النصوص من مصادر خارجية، ولا تعني نسبتها إلى المصدر أن الحديث قد تحققت صحته.",language:"لغة البحث",grade:"الحكم المنقول من بيانات الناشر",limited:"تغطي هذه الخدمة النسخ المتاحة فقط، ولا تحتوي جميعها على تراجم الرواة وأسانيدهم بالتفصيل.",indexed:"الفهرس المختصر يعمل · تُحمّل النصوص الظاهرة فقط",missingText:"النص غير متاح مؤقتًا لدى المصدر، ويمكن فتح المرجع.",match:"تطابق المرجع العربي والفرنسي في الرقم والكتاب والموضع",onlyNumber:"الرقم متطابق لكن المرجع التفصيلي مختلف، فلا تُثبت المطابقة",noMatch:"لم يُتحقق من مرجع مقابل",arabicRef:"النص العربي",frenchRef:"الترجمة الفرنسية"};
const en={label:"Search online hadith collections",source:"Remote source: Hadith API @1",wait:"Searching online editions…",
found:(n:number,books:number)=>n+" result(s) across "+books+" checked collection(s)",missing:"Partial results: some editions are unavailable or failed to respond.",empty:"No matches in available editions. Try Arabic or select a collection.",open:"Open the readable hadith profile",download:"Download CSV and view sources",next:"Next",prev:"Previous",page:(n:number,m:number)=>"Page "+n+" / "+m,none:"Remote source temporarily unavailable; local results remain available.",notice:"Remote texts and translations are not independent authentication or an isnad assessment.",language:"Search language",grade:"Grading quoted from the dataset, with attribution",limited:"Only available external editions are covered; biographies and full chains are not systematically supplied.",indexed:"Compact index enabled · only visible narrations are fetched",missingText:"Text temporarily unavailable upstream. The reference link is still available.",match:"Arabic and French references align (same number, book and position)",onlyNumber:"Same global number but different book/position: not confirmed",noMatch:"No verified matching reference",arabicRef:"Arabic text",frenchRef:"French translation"};

export function RechercheDistanteLoading({locale}:{locale:string}){
 const t=locale==="ar"?ar:locale==="fr"?fr:en;
 return <section className={styles.panel} aria-live="polite"><h2>{t.label}</h2><p>{t.wait}</p></section>;
}
export default async function ResultatsDistants({locale,saisie,recueil,page,recherche}:{
  locale:string;saisie:string;recueil?:string;page:number;recherche:string;
}){
 const t=locale==="ar"?ar:locale==="fr"?fr:en;
 if(!saisie.trim()||saisie.trim().length>90||!EXTERNAL_COLLECTIONS.some(c=>!recueil||c.id===recueil))return null;
 const lang=remoteLanguage(locale,saisie);
 let result:Awaited<ReturnType<typeof remoteSearch>>|undefined;
 try{result=await remoteSearch(saisie,recueil,lang,page);}
 catch{return <section className={styles.panel}><h2>{t.label}</h2><p role="status">{t.none}</p><Link href="/sources">{t.download}</Link></section>;}
 if(!result)return null;
 const getPage=(n:number)=>{
  const params=new URLSearchParams(recherche);
  params.set("pageExterne",String(n));
  return "/recherche?"+params.toString();
 };
 return <section className={styles.panel} aria-labelledby="remote-search-heading">
   <header className={styles.header}>
     <div><span className={styles.kicker}>◈ {t.source}</span><h2 id="remote-search-heading">{t.label}</h2>
      <p>{t.found(result.total,result.checked)} · {t.language}: <bdi dir="ltr">{lang}</bdi></p>{result.indexed&&<span className={styles.indexed}>✓ {t.indexed}</span>}</div>
     <Link href="/sources" className={styles.download}>↓ {t.download}</Link>
   </header>
   {result.unavailable.length>0&&<p className={styles.warning} role="status">{t.missing} {result.unavailable.join(" · ")}</p>}
   {result.total===0&&<p className={styles.empty}>{result.checked===0?t.none:t.empty}</p>}
   <ol className={styles.results}>
     {result.items.map(h=><li key={h.id} className={styles.card}>
       <div className={styles.meta}><strong>{h.nom}</strong><span>№ {h.numero}</span></div>
       <p className={styles.text} lang={lang==="ara"?"ar":lang==="fra"?"fr":lang==="eng"?"en":locale}
         dir={lang==="ara"||lang==="urd"?"rtl":"ltr"}>{h.texte?h.texte.slice(0,450)+(h.texte.length>450?"…":""):t.missingText}</p>
       {h.concordance?.status==="reference-confirmed"&&h.concordance.url&&(
         <p className={styles.concordance}>✓ {t.match} · <Link href={"/source/"+h.recueil+"/"+h.concordance.language+"/"+h.numero}>
           {h.concordance.language==="ara"?t.arabicRef:t.frenchRef} ↗
         </Link></p>
       )}
       {h.concordance?.status==="number-only"&&<p className={styles.unconfirmed}>{t.onlyNumber}</p>}
       {h.concordance?.status==="unavailable"&&<p className={styles.unconfirmed}>{t.noMatch}</p>}
       {h.grades.length>0&&<p className={styles.grade}>{t.grade}: {h.grades.map(g=>g.name+" : "+g.grade).join(" · ")}</p>}
       <div className={styles.cardActions}>
         <Link href={"/source/"+h.recueil+"/"+h.langue+"/"+h.numero} className={styles.detailLink}>{t.open} ↗</Link>
         <Link href={"/rapport-source/"+h.recueil+"/"+h.langue+"/"+h.numero} className={styles.reportLink}>▤ {libellesRapport(locale).report} ↗</Link>
       </div>
     </li>)}
   </ol>
   {result.pageTotal>1&&<nav className={styles.pagination}>
     {result.page>1&&<Link href={getPage(result.page-1)}>{t.prev}</Link>}
     <span>{t.page(result.page,result.pageTotal)}</span>
     {result.page<result.pageTotal&&<Link href={getPage(result.page+1)}>{t.next}</Link>}
   </nav>}
   <p className={styles.note}>{t.notice} {t.limited}</p>
 </section>;
}
