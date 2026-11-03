import {Link} from "@/i18n/navigation";
import {classification,langueThemes} from "@/donnees/themes";
import ExplorateurChapitres from "@/composants/ExplorateurChapitres";
import styles from "@/app/[locale]/themes/Themes.module.css";

const ui={
 fr:{titre:"Les grands chapitres de l’islam",description:"Les hadiths sont organisés par grands thèmes et sous-thèmes, afin de faciliter la recherche, l’étude et la compréhension de l’enseignement prophétique.",chercher:"Rechercher un hadith, un thème, un mot-clé…",rechercher:"Rechercher",chapitres:"Grands chapitres",sujets:"sous-thèmes",bibliotheque:"Bibliothèque de hadiths",note:"Navigation thématique : les hadiths sont classés par grands thèmes et sous-thèmes. Les références sont à vérifier à partir des recueils reconnus."},
 ar:{titre:"الأبواب الكبرى في الإسلام",description:"تم تنظيم الأحاديث حسب الأبواب الرئيسية والفرعية لتسهيل البحث والدراسة.",chercher:"ابحث عن حديث أو موضوع أو كلمة…",rechercher:"بحث",chapitres:"الأبواب الرئيسية",sujets:"موضوعًا فرعيًا",bibliotheque:"مكتبة الحديث",note:"تصنيف موضوعي، وتخضع نسبة الأحاديث وأحكامها للتحقق من المصادر."},
 en:{titre:"Major chapters of Islam",description:"Hadiths are organized by major topics and subtopics, making it easier to search, study and understand the transmitted teachings.",chercher:"Search a hadith, topic or keyword…",rechercher:"Search",chapitres:"Major chapters",sujets:"subtopics",bibliotheque:"Hadith library",note:"Thematic navigation. Hadith references and authenticity judgments must be verified from source collections."}
} as const;

export default function VueCatalogue({locale}:{locale:string}){
 const l=langueThemes(locale),t=ui[l];
 return <div className={styles.vueCatalogue}>
   <section className={styles.hero} aria-label={t.bibliotheque}>
    <div className={styles.heroDecoration} aria-hidden="true"><span>✧</span><span>☾</span><span>۞</span></div>
    <div className={styles.marquePrestige}>Milaghaiba</div>
    <p className={styles.arMarque} dir="rtl" lang="ar">الملة الغائبة</p>
    <p className={styles.surtitre}>✦ {t.bibliotheque} ✦</p>
    <h1>{t.titre}</h1>
    <p className={styles.heroDescription}>{t.description}</p>
    <form action={`/${locale}/recherche`} method="get" role="search" className={styles.rechercheHero}>
      <label htmlFor="q-theme" className={styles.srOnly}>{t.chercher}</label>
      <span aria-hidden="true">⌕</span>
      <input id="q-theme" name="q" type="search" placeholder={t.chercher} dir="auto"/>
      <button type="submit">{t.rechercher}</button>
    </form>
   </section>
   <div className={styles.blocTitre}>
     <span aria-hidden="true">✧</span>
     <div><h2>{t.chapitres}</h2><p>{classification.chapitres.length} {l==="ar"?"بابًا":l==="en"?"chapters":"chapitres"} · {classification.chapitres.reduce((n,c)=>n+c.themes.length,0)} {t.sujets}</p></div>
     <span aria-hidden="true">✧</span>
   </div>
   <ExplorateurChapitres chapitres={classification.chapitres} langue={l}/>
   <div className={styles.basPage}><span aria-hidden="true">▤</span> {t.note}</div>
 </div>;
}
