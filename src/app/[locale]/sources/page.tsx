import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { EXTERNAL_COLLECTIONS, externalSourceRevision } from "@/donnees/recherche-distante";
import { Link } from "@/i18n/navigation";
import styles from "./Sources.module.css";

export const metadata:Metadata={title:"Bibliothèque de sources et téléchargements — Milaghaiba"};
export default async function Sources({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 setRequestLocale(locale);
 const ar=locale==="ar",en=locale==="en";
 const title=ar?"مصادر الحديث وتنزيل ملفات CSV":en?"Hadith sources and CSV downloads":"Sources des hadiths et téléchargements CSV";
 const subtitle=ar?"نزّل نسخة من كل كتاب عند الطلب، أو تصفح مصدره دون تخزينه على خادم الموقع.":en?"Download individual collections on demand without storing the full corpus on this site's server.":"Téléchargez les recueils un par un, à la demande, sans stocker l'ensemble du corpus sur le serveur Render.";
 const csvLabel=ar?"تنزيل CSV":en?"Download CSV":"Télécharger CSV";
 const sourceLabel=ar?"المصدر الأصلي":en?"Upstream source":"Source originale";
 const sourceA=ar?"عربي":en?"Arabic":"Arabe";
 const sourceF=ar?"فرنسي":en?"French":"Français";
 const sourceE=ar?"إنجليزي":en?"English":"Anglais";
 return (
 <main className={styles.root} id="contenu" tabIndex={-1}>
   <header className={styles.hero}>
     <span className={styles.eyebrow}>✦ MILAGHAIBA / SOURCES</span>
     <h1>{title}</h1><p>{subtitle}</p>
     <Link href="/recherche" className={styles.back}>← {ar?"العودة إلى البحث":en?"Back to search":"Retour à la recherche"}</Link>
   </header>
   <section className={styles.warning}>
     <h2>{ar?"حدود البيانات":en?"Data quality and usage":"Provenance, droits et limites"}</h2>
     <p>{ar?"تُؤخذ النصوص من مصدر خارجي محدد النسخة. الروابط وأرقام الأحاديث مرتبطة بالنسخة المصدّرة، لكن هذا لا يعني التحقق من صحة الأحاديث أو جميع أسانيدها.":"Ces fichiers sont générés à partir d'une édition externe identifiée. Ils contiennent les textes, numéros, références, mentions de classement éventuellement publiées et liens de provenance. Ils ne fournissent pas systématiquement les chaînes complètes, les biographies ou une certification scientifique de chaque hadith."}</p>
     <p>{ar?"قد تختلف أرقام الكتب والحقوق الخاصة بالترجمات. تحقّق من أذونات إعادة استخدام كل إصدار.":"Les numérotations peuvent différer selon les éditions. Vérifiez les droits de chaque traduction avant redistribution ou publication : une API ouverte ne signifie pas que toutes ses traductions sont libres de droits."}</p>
   </section>
   <section aria-label={ar?"الكتب":en?"Collections":"Recueils"} className={styles.grid}>
    {EXTERNAL_COLLECTIONS.map(c=>(
     <article key={c.id} className={styles.card}>
       <span className={styles.tag}>{c.nom}</span>
       <div className={styles.row}><a href={"/api/hadiths/export?recueil="+c.id+"&langue=ara"}>{csvLabel} · {sourceA} ↓</a>
       {c.fr&&<a href={"/api/hadiths/export?recueil="+c.id+"&langue=fra"}>{csvLabel} · {sourceF} ↓</a>}
       <a href={"/api/hadiths/export?recueil="+c.id+"&langue=eng"}>{csvLabel} · {sourceE} ↓</a></div>
       {!c.fr&&<p className={styles.note}>{ar?"لا تتوفر ترجمة فرنسية في النسخة المحددة":en?"No French edition in this upstream revision":"Pas d'édition française dans cette version du fournisseur."}</p>}
       <a className={styles.upstream} target="_blank" rel="noopener noreferrer" href={"https://github.com/fawazahmed0/hadith-api/tree/1/editions"}>{sourceLabel} ↗</a>
     </article>
    ))}
   </section>
   <section className={styles.other}>
     <h2>{ar?"مصادر أخرى لدراسة الأسانيد":en?"Additional resources for isnads":"Autres sources pour les chaînes de transmission"}</h2>
     <p><a href="https://data.mendeley.com/datasets/5xth87zwb5/5" target="_blank" rel="noopener noreferrer">Sanadset 650K — CC BY 4.0 ↗</a> : {ar?"بيانات بحثية عن طرق الأحاديث؛ لا يُستخدم تصنيفها آلياً للحكم على الحديث.":"jeu de recherche sur les narrateurs et isnāds, non intégré aux classements automatiques du site."}</p>
     <p><a href="https://huggingface.co/datasets/meeAtif/hadith_datasets" target="_blank" rel="noopener noreferrer">Hugging Face — Sunnah Dataset CSV/JSON ↗</a> : {ar?"مجموعة إضافية للمقارنة مع التحقق من التراخيص.":"jeu CSV/JSON complémentaire pour comparer les références, sous réserve des licences des contenus."}</p>
     <p className={styles.revision}>API: {externalSourceRevision} · <a href="https://github.com/fawazahmed0/hadith-api/blob/1/References.md" target="_blank" rel="noopener noreferrer">{ar?"مصادر الترجمات":en?"Translations provenance":"Provenance des traductions"} ↗</a></p>
   </section>
 </main>);
}
