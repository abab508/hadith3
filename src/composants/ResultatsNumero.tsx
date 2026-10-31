import { readIndex } from "@/donnees/index-leger";
import { EXTERNAL_COLLECTIONS } from "@/donnees/recherche-distante";
import { numeroDemande } from "@/donnees/recherche";
import { Link } from "@/i18n/navigation";
import { libellesRapport } from "@/composants/ActionsRapport";
import styles from "./ResultatsNumero.module.css";

/** Recherche par numéro : toujours traiter les références AVANT le corpus de démonstration.
 * Ne crée aucun lien vers un hadith non présent dans l'index de cette édition. */
export async function referencesPourNumero(raw:string,recueil?:string){
 const numero=numeroDemande(raw);
 if(!numero||!Number.isSafeInteger(Number(numero))||Number(numero)<1||Number(numero)>100000)
  return {numero:null,matches:[],indisponibles:[]} as const;
 const collections=EXTERNAL_COLLECTIONS.filter(c=>!recueil||c.id===recueil);
 const results=await Promise.all(collections.map(async collection=>{
  const [ar,fr]=await Promise.all([readIndex("ara",collection.key),collection.fr?readIndex("fra",collection.key):Promise.resolve(null)]);
  if(!ar&&!fr)return {collection,found:null as null,missing:true};
  const arDoc=ar?.docs.find(d=>d[0]===Number(numero));
  const frDoc=fr?.docs.find(d=>d[0]===Number(numero));
  if(!arDoc&&!frDoc)return {collection,found:null as null,missing:false};
  const aligned=!!arDoc&&!!frDoc&&arDoc[0]===frDoc[0]&&arDoc[1]===frDoc[1]&&arDoc[2]===frDoc[2];
  return {collection,found:{
   numero:Number(numero),ar:!!arDoc,fr:!!frDoc,
   section:frDoc?.[1]??arDoc?.[1],
   dansSection:frDoc?.[2]??arDoc?.[2],aligned
  },missing:false};
 }));
 return {numero,matches:results.filter(x=>x.found!==null).map(x=>({collection:x.collection,...x.found!})),
  indisponibles:results.filter(x=>x.missing).map(x=>x.collection.nom)};
}
export default async function ResultatsNumero({locale,saisie,recueil}:{locale:string;saisie:string;recueil?:string}){
 const result=await referencesPourNumero(saisie,recueil);
 if(!result.numero)return null;
 const ar=locale==="ar",en=locale==="en";
 const t={
  title:ar?"البحث برقم الحديث":en?"Search by hadith number":"Recherche par numéro de hadith",
  total:ar?"نتيجة في الكتب المفهرسة":en?"matching collections indexed":"recueil(s) contenant ce numéro",
  hint:ar?"أرقام الأحاديث تتكرر بين كتب مختلفة: اختر الكتاب المقصود.":en?"The same number may exist in several books. Select the intended collection.":"Un même numéro peut désigner des hadiths différents selon le recueil. Choisissez le bon.",
  number:ar?"رقم":en?"No.":"n°",
  book:ar?"الكتاب":en?"Book":"Livre",
  readFr:ar?"قراءة الترجمة الفرنسية":en?"Read French edition":"Lire l'édition française",
  readAr:ar?"قراءة النص العربي":en?"Read Arabic edition":"Lire le texte arabe",
  aligned:ar?"تطابقت الإحالة في النسختين":en?"References aligned between editions":"Références concordantes dans les deux éditions",
  notAligned:ar?"لم يثبت تطابق الإحالتين":en?"Edition alignment not confirmed":"Correspondance arabe/français non confirmée",
  absent:ar?"لا يوجد هذا الرقم في الفهارس المتاحة. تحقق من رقم الطبعة أو اختر كتابًا آخر.":en?"No indexed collection contains this number. Check the edition numbering or select another book.":"Ce numéro n'apparaît dans aucun des recueils indexés consultés. Vérifiez la numérotation de l'édition ou choisissez un autre recueil.",
  missing:ar?"بعض الفهارس غير متاحة":en?"Some indexes unavailable":"Certains index indisponibles",
  original:ar?"فهرس المصادر":en?"Source catalogue":"Catalogue des sources"
 };
 return <section className={styles.panel} aria-labelledby="numero-hadith-titre">
  <div className={styles.heading}>
   <div><span className={styles.kicker}>◈ {t.title}</span>
    <h2 id="numero-hadith-titre"><bdi dir="ltr">{result.numero}</bdi> · {result.matches.length} {t.total}</h2>
    <p>{t.hint}</p></div>
   <Link href="/sources" className={styles.catalogue}>{t.original} ↗</Link>
  </div>
  {result.matches.length===0&&<p className={styles.empty} role="status">{t.absent}</p>}
  {result.indisponibles.length>0&&<p className={styles.warning}>{t.missing} : {result.indisponibles.join(" · ")}</p>}
  <div className={styles.grid}>
   {result.matches.map(r=>(
    <article key={r.collection.id} className={styles.card}>
     <h3>{r.collection.nom}</h3>
     <p className={styles.references}>{t.number} <strong><bdi dir="ltr">{r.numero}</bdi></strong> · {t.book} <strong><bdi dir="ltr">{r.section??"—"} / {r.dansSection??"—"}</bdi></strong></p>
     <div className={styles.links}>
      {r.fr&&<Link className={styles.primary} href={"/source/"+r.collection.id+"/fra/"+r.numero}>{t.readFr} ↗</Link>}
      {r.ar&&<Link className={styles.secondary} href={"/source/"+r.collection.id+"/ara/"+r.numero}>{t.readAr} ↗</Link>}
      <Link className={styles.secondary} href={"/rapport-source/"+r.collection.id+"/"+(locale==="ar"||!r.fr?"ara":"fra")+"/"+r.numero}>▤ {libellesRapport(locale).report} ↗</Link>
     </div>
     {r.fr&&r.ar&&<p className={r.aligned?styles.match:styles.unconfirmed}>{r.aligned?"✓ "+t.aligned:t.notAligned}</p>}
    </article>
   ))}
  </div>
  <p className={styles.footnote}>{ar?"تطابق الأرقام أو المراجع ليس حكماً بصحة الحديث.":en?"A matching number or reference does not authenticate a hadith.":"La présence du numéro ou sa concordance entre éditions ne constitue pas un jugement d'authenticité."}</p>
 </section>;
}
