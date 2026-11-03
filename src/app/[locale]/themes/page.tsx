import type { Metadata } from "next";
import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {classification,langueThemes} from "@/donnees/themes";
import styles from "./Themes.module.css";

const ui={
 fr:{retour:"Accueil",titre:"Les grands chapitres de l’islam",description:"Une bibliothèque thématique des hadiths : explorez les grands domaines puis leurs sujets détaillés.",sujets:"sous-thèmes",ouvrir:"Explorer ce chapitre",note:"Classification éditoriale. Les références et jugements doivent être contrôlés dans les recueils originaux ; aucun hadith n'est attribué automatiquement."},
 ar:{retour:"الرئيسية",titre:"الأبواب الكبرى في الإسلام",description:"تصفح موضوعات الأحاديث حسب الأبواب الكبرى ثم الموضوعات الفرعية.",sujets:"موضوعًا فرعيًا",ouvrir:"استكشف الباب",note:"تصنيف موضوعي للتصفح، ولا يعني إثبات نسبة الأحاديث أو صحتها دون مراجعة المصادر."},
 en:{retour:"Home",titre:"Major chapters of Islam",description:"Browse hadith topics by major areas and detailed subtopics.",sujets:"subtopics",ouvrir:"Explore chapter",note:"Editorial navigation taxonomy. References and authenticity judgments require source verification."}
};
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;const l=langueThemes(locale);
 return {title:ui[l].titre,description:ui[l].description};
}
export default async function Themes({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;setRequestLocale(locale);
 const l=langueThemes(locale);const t=ui[l];
 return <main className={styles.page} id="contenu" tabIndex={-1}>
   <div className={styles.hero}><Link href="/">{t.retour}</Link>
    <div className={styles.ornement} aria-hidden="true">✦ ۞ ✦</div>
    <p className={styles.surtitre}>MILAGHAIBA · مكتبة الحديث</p>
    <h1>{t.titre}</h1><p>{t.description}</p>
    <span className={styles.compteur}>{classification.chapitres.length} {l==="ar"?"بابًا رئيسيًا":l==="en"?"major chapters":"grands chapitres"} · {classification.chapitres.reduce((n,c)=>n+c.themes.length,0)} {t.sujets}</span>
   </div>
   <section className={styles.grille} aria-label={t.titre}>
    {classification.chapitres.map((c,i)=><Link href={`/themes/${c.slug}`} key={c.slug} className={`${styles.carte} ${styles[c.fond]}`}>
     <span className={styles.numero}>{String(i+1).padStart(2,"0")}</span><span className={styles.ornementCarte} aria-hidden="true">✧</span>
     <h2>{c.nom[l]}</h2><span className={styles.nomAr} lang="ar" dir="rtl">{c.nom.ar}</span>
     <p>{c.themes.length} {t.sujets}</p><span className={styles.ouvrir}>{t.ouvrir} ↗</span>
    </Link>)}
   </section>
   <p className={styles.note}>{t.note}</p>
 </main>;
}
