"use client";

import {useSearchParams} from "next/navigation";
import {useLocale,useTranslations} from "next-intl";
import {languesDuSelecteur,nomLangueTraduit} from "@/donnees/langues-affichage";
import {memoriserInterface} from "@/donnees/preferences-visiteur";
import {Link,usePathname} from "@/i18n/navigation";
import styles from "@/composants/SelecteurLangue.module.css";

const principaux=["fr","ar","en"];
const autres=[
 {href:"/chaine",label:{fr:"Recherche par chaîne",ar:"البحث بالإسناد",en:"Chain search"}},
 {href:"/glossaire",label:{fr:"Glossaire",ar:"المعجم",en:"Glossary"}},
 {href:"/memorisation",label:{fr:"Mémoriser",ar:"الحفظ",en:"Memorize"}},
 {href:"/parametres",label:{fr:"Paramètres",ar:"الإعدادات",en:"Settings"}},
 {href:"/langues",label:{fr:"Langues",ar:"اللغات",en:"Languages"}},
] as const;

export default function SelecteurLangue(){
 const locale=useLocale();
 const t=useTranslations("selecteurLangue");
 const chemin=usePathname();
 const search=useSearchParams().toString();
 const destination=search?`${chemin}?${search}`:chemin;
 const l=locale==="ar"?"ar":locale==="en"?"en":"fr";
 const toutes=languesDuSelecteur();
 const visibles=toutes.filter(x=>principaux.includes(x.tag) && x.niveaux.interface);
 const autresLangues=toutes.filter(x=>!principaux.includes(x.tag));
 return <nav className={styles.selecteur} aria-label={t("titre")}>
  <ul className={styles.liens}>
   <li><Link href="/" aria-current={chemin==="/"?"page":undefined}>{l==="ar"?"الرئيسية":l==="en"?"Home":"Accueil"}</Link></li>
   <li><Link href="/themes" aria-current={chemin==="/themes"||chemin.startsWith("/themes/")?"page":undefined}>{l==="ar"?"الموضوعات":l==="en"?"Themes":"Thèmes"} <span aria-hidden="true">⌄</span></Link></li>
   <li><Link href="/recherche" aria-current={chemin==="/recherche"?"page":undefined}><span aria-hidden="true">⌕ </span>{l==="ar"?"بحث":l==="en"?"Search":"Recherche"}</Link></li>
   <li><Link href="/sources" aria-current={chemin==="/sources"?"page":undefined}><span aria-hidden="true">▤ </span>{l==="ar"?"المصادر":l==="en"?"Sources":"Sources"}</Link></li>
  </ul>
  <div className={styles.languesCompactes} aria-label={t("titre")}>
   {visibles.map((langue,i)=><span key={langue.tag} className={styles.langueUnite}>
    {i>0&&<span aria-hidden="true" className={styles.separateur}>|</span>}
    <Link href={destination} locale={langue.tag} hrefLang={langue.tag} onClick={()=>memoriserInterface(langue.tag)}
       aria-current={langue.tag===locale?"page":undefined}>{langue.tag.toUpperCase()}</Link>
   </span>)}
  </div>
  <details className={styles.plus}>
    <summary>{l==="ar"?"المزيد":l==="en"?"More":"Plus"} <span aria-hidden="true">⌄</span></summary>
    <div className={styles.menuPlus}>
      <ul>{autres.map(({href,label})=><li key={href}><Link href={href} aria-current={chemin===href?"page":undefined}>{label[l]}</Link></li>)}</ul>
      <p>{l==="ar"?"لغات أخرى":l==="en"?"Other languages":"Autres langues"}</p>
      <ul>{autresLangues.map(langue=>{
       const natif=langue.nomNatif;const traduit=nomLangueTraduit(langue,locale);
       return <li key={langue.tag}>{langue.niveaux.interface?
        <Link href={destination} locale={langue.tag} hrefLang={langue.tag} onClick={()=>memoriserInterface(langue.tag)}>
         <bdi lang={langue.tag} dir={langue.direction}>{natif}</bdi>{traduit!==natif?` — ${traduit}`:""}
        </Link>:<span aria-disabled="true">{natif} ({t("indisponible")})</span>}</li>;
      })}</ul>
    </div>
  </details>
 </nav>;
}
