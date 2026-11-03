import type { Metadata } from "next";
import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {classification,langueThemes} from "@/donnees/themes";
import ExplorateurChapitres from "@/composants/ExplorateurChapitres";
import styles from "./Themes.module.css";

const ui={
 fr:{retour:"Accueil",titre:"Les grands chapitres de l’islam",description:"Les hadiths sont organisés par grands thèmes et sous-thèmes, afin de faciliter la recherche et l'étude des enseignements prophétiques.",sujets:"sous-thèmes",ouvrir:"Explorer les chapitres",note:"Classification éditoriale. Les références et jugements doivent être contrôlés dans les recueils originaux ; aucun hadith n'est attribué automatiquement.",chercher:"Rechercher un hadith, un thème, un mot-clé…",bouton:"Rechercher",bibliotheque:"Bibliothèque de hadiths"},
 ar:{retour:"الرئيسية",titre:"الأبواب الكبرى في الإسلام",description:"تم تنظيم موضوعات الأحاديث حسب الأبواب الرئيسية والفرعية لتسهيل البحث والدراسة.",sujets:"موضوعًا فرعيًا",ouvrir:"تصفح الأبواب",note:"هذا تصنيف موضوعي للتصفح، ولا يثبت نسبة حديث أو صحته دون مراجعة المصادر.",chercher:"ابحث عن حديث أو موضوع أو كلمة…",bouton:"بحث",bibliotheque:"مكتبة الحديث"},
 en:{retour:"Home",titre:"Major chapters of Islam",description:"Hadiths are organized into major chapters and subtopics to help you explore and study their teachings.",sujets:"subtopics",ouvrir:"Explore the chapters",note:"Editorial navigation taxonomy. References and authenticity judgments require source verification.",chercher:"Search hadiths, topics, keywords…",bouton:"Search",bibliotheque:"Hadith library"}
};
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;const l=langueThemes(locale);
 return {title:ui[l].titre,description:ui[l].description};
}
export default async function Themes({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;setRequestLocale(locale);
 const l=langueThemes(locale);const t=ui[l];
 return <main className={styles.page} id="contenu" tabIndex={-1}>
   <section className={styles.hero} aria-label={t.bibliotheque}>
    <div className={styles.heroDecoration} aria-hidden="true"><span>۞</span><span>☾</span><span>✧</span></div>
    <nav className={styles.navigationLocale} aria-label={t.bibliotheque}>
      <Link href="/">{t.retour}</Link><span>✧</span><Link href="/sources">{l==="ar"?"المصادر":l==="en"?"Sources":"Sources"}</Link>
    </nav>
    <div className={styles.marquePrestige}>Milaghaiba</div>
    <p className={styles.arMarque} dir="rtl" lang="ar">الملة الغائبة</p>
    <p className={styles.surtitre}>✧ {t.bibliotheque} ✧</p>
    <h1>{t.titre}</h1><p className={styles.heroDescription}>{t.description}</p>
    <form action={`/${locale}/recherche`} method="get" role="search" className={styles.rechercheHero}>
      <label htmlFor="q-theme" className={styles.srOnly}>{t.chercher}</label>
      <span aria-hidden="true">⌕</span>
      <input id="q-theme" name="q" type="search" placeholder={t.chercher} dir="auto" />
      <button type="submit">{t.bouton}</button>
    </form>
   </section>
   <div className={styles.blocTitre}><span aria-hidden="true">✧</span>
     <div><h2>{l==="ar"?"الأبواب الرئيسية":l==="en"?"Major chapters":"Grands chapitres"}</h2>
       <p>{classification.chapitres.length} {l==="ar"?"بابًا":l==="en"?"chapters":"chapitres"} · {classification.chapitres.reduce((n,c)=>n+c.themes.length,0)} {t.sujets}</p></div>
     <span aria-hidden="true">✧</span>
   </div>
   <ExplorateurChapitres chapitres={classification.chapitres} langue={l} />
   <div className={styles.basPage}><span aria-hidden="true">▤</span> {t.note}</div>
 </main>;
}
