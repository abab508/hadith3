import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {classification,chapitreParSlug,langueThemes} from "@/donnees/themes";
import styles from "../Themes.module.css";

const ui={
 fr:{retour:"Tous les chapitres",sujets:"Sous-thèmes",detail:"Rechercher dans les recueils",message:"Les liens ouvrent la recherche documentaire. Aucun hadith n’est automatiquement attribué à ce sujet : vérifier les sources et leurs éditions.",recherche:"Rechercher"},
 ar:{retour:"جميع الأبواب",sujets:"الموضوعات الفرعية",detail:"ابحث في كتب الحديث",message:"تفتح الروابط صفحة البحث. لا يُنسب حديث إلى هذا الموضوع تلقائيًا دون التحقق من المصادر.",recherche:"ابحث"},
 en:{retour:"All chapters",sujets:"Subtopics",detail:"Search the collections",message:"Links open documentary search. No hadith is automatically attributed to a topic without source verification.",recherche:"Search"}
};
export function generateStaticParams(){return classification.chapitres.map(c=>({chapitre:c.slug}));}
export async function generateMetadata({params}:{params:Promise<{locale:string;chapitre:string}>}):Promise<Metadata>{
 const {locale,chapitre}=await params;const c=chapitreParSlug(chapitre);
 return c?{title:c.nom[langueThemes(locale)]}:{};
}
export default async function Chapitre({params}:{params:Promise<{locale:string;chapitre:string}>}){
 const {locale,chapitre}=await params;setRequestLocale(locale);
 const c=chapitreParSlug(chapitre);if(!c)notFound();
 const l=langueThemes(locale);const t=ui[l];
 return <main id="contenu" tabIndex={-1} className={styles.page}>
  <Link href="/themes" className={styles.retour}>← {t.retour}</Link>
  <header className={`${styles.hero} ${styles[c.fond]}`}>
   <div className={styles.ornement} aria-hidden="true">✦ ۞ ✦</div>
   <p className={styles.surtitre}>MILAGHAIBA · {c.nom.ar}</p>
   <h1>{c.nom[l]}</h1><p>{c.themes.length} {t.sujets.toLowerCase()}</p>
  </header>
  <section aria-labelledby="sous-themes" className={styles.catalogue}>
   <h2 id="sous-themes">{t.sujets}</h2>
   <div className={styles.sousGrille}>
    {c.themes.map((s,i)=><article className={styles.sousCarte} key={s.slug}>
      <span className={styles.numero}>{String(i+1).padStart(2,"0")}</span>
      <h3>{s.nom[l]}</h3>
      {l!=="ar"&&<p lang="ar" dir="rtl" className={styles.nomAr}>{s.nom.ar}</p>}
      <Link href={`/recherche?q=${encodeURIComponent(s.nom.ar)}&mode=approximative`} className={styles.rechercher}>{t.recherche} ↗</Link>
    </article>)}
   </div>
   <h2>{t.detail}</h2><p className={styles.note}>{t.message}</p>
   <Link href="/sources">{l==="ar"?"المصادر":l==="en"?"Source collections":"Bibliothèque des sources"} ↗</Link>
  </section>
 </main>;
}
