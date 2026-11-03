"use client";

import {useState} from "react";
import {Link} from "@/i18n/navigation";
import styles from "@/app/[locale]/themes/Themes.module.css";

type Nom={fr:string;ar:string;en:string};
type Langue="fr"|"ar"|"en";
type Chapitre={slug:string;fond:"cosmos"|"eau"|"sobre";nom:Nom;themes:{slug:string;nom:Nom}[]};
const labels={
 fr:{explorer:"Explorer",sousThemes:"Sous-thèmes",voirTout:"Voir tous les sous-thèmes",recherche:"Rechercher",ouverture:"Ouvrir le chapitre",selection:"Chapitre sélectionné"},
 ar:{explorer:"استكشف",sousThemes:"موضوعات فرعية",voirTout:"عرض جميع الموضوعات",recherche:"ابحث",ouverture:"افتح الباب",selection:"الباب المحدد"},
 en:{explorer:"Explore",sousThemes:"Subtopics",voirTout:"See all subtopics",recherche:"Search",ouverture:"Open chapter",selection:"Selected chapter"}
} as const;
const introductions:Record<Langue,string>={
 fr:"Explorez les enseignements transmis dans les recueils et les sous-thèmes associés, avec leurs références documentaires.",
 ar:"استكشف الموضوعات الواردة في كتب الحديث مع مراجعة النصوص ومصادرها.",
 en:"Explore topics documented in hadith collections, with source references to verify."
};
const introFamille:Record<Langue,string>={
 fr:"Les enseignements transmis relatifs au mariage, à la vie conjugale et à l’éducation des enfants.",
 ar:"الأحاديث المتعلقة بالزواج والحياة الزوجية وتربية الأبناء.",
 en:"Narrations on marriage, family life, and raising children."
};
const symboles:Record<string,string>={
 croyance:"☪",science:"✧",purification:"◉",priere:"۞",jeune:"☾",zakat:"♡",pelerinage:"⌂",famille:"❦",comportement:"❧",commerce:"⚖",vie:"✺",sante:"✶",spiritualite:"✦",histoire:"☼",justice:"◇",eschatologie:"⌛"
};
export default function ExplorateurChapitres({chapitres,langue}:{chapitres:Chapitre[];langue:Langue}){
 const [selection,setSelection]=useState("famille");
 const [tous,setTous]=useState(false);
 const ordre=["croyance","purification","priere","jeune","famille","commerce","comportement","eschatologie"];
 const visibles=tous?chapitres:ordre.map(slug=>chapitres.find(c=>c.slug===slug)).filter((c):c is Chapitre=>Boolean(c));
 const actif=chapitres.find(c=>c.slug===selection)??chapitres[0]!;
 const t=labels[langue];
 return <div className={styles.explorateur}>
  <div className={styles.grilleExplorer} role="group" aria-label={t.selection}>
   {visibles.map((c,index)=><button key={c.slug} type="button" aria-pressed={c.slug===selection}
    onClick={()=>setSelection(c.slug)} className={`${styles.carteExplorer} ${styles[c.fond]} ${styles["theme"+c.slug]??""} ${c.slug===selection?styles.selectionnee:""}`}>
    <span className={styles.numero}> {String(chapitres.indexOf(c)+1).padStart(2,"0")} </span>
    <span className={styles.pictogramme} aria-hidden="true">{symboles[c.slug]??"✦"}</span>
    <strong>{c.nom[langue]}</strong>
    {langue!=="ar"&&<span className={styles.nomAr} dir="rtl" lang="ar">{c.nom.ar}</span>}
   </button>)}
   <button type="button" className={styles.plusChapitres} aria-expanded={tous} onClick={()=>setTous(v=>!v)}>
     {tous?(langue==="ar"?"عرض الأبواب الرئيسية":langue==="en"?"Show featured chapters":"Afficher les chapitres principaux"):(langue==="ar"?"عرض جميع الأبواب الـ ١٦":langue==="en"?"Show all 16 chapters":"Voir les 16 grands chapitres")} <span aria-hidden="true">⌄</span>
   </button>
  </div>
  <aside className={`${styles.panneau} ${styles[actif.fond]}`} aria-label={t.selection} aria-live="polite">
   <span className={styles.panneauSymbole} aria-hidden="true">{symboles[actif.slug]??"✦"}</span>
   <p className={styles.panneauEyebrow}>{t.selection} · {String(chapitres.indexOf(actif)+1).padStart(2,"0")}/{chapitres.length}</p>
   <h3>{actif.nom[langue]}</h3>
   {langue!=="ar"&&<p className={styles.panneauAr} dir="rtl" lang="ar">{actif.nom.ar}</p>}
   <p className={styles.panneauDescription}>{actif.slug==="famille"?introFamille[langue]:introductions[langue]}</p>
   <div className={styles.panneauDiviseur}><span>✧</span>{t.sousThemes}<span>✧</span></div>
   <div className={styles.listeThemes}>
    {actif.themes.slice(0,6).map(theme=><Link key={theme.slug}
     href={`/recherche?q=${encodeURIComponent(theme.nom.ar)}&mode=approximative`}
     title={t.recherche} className={styles.themeLien}><span>{theme.nom[langue]}</span><span aria-hidden="true">›</span></Link>)}
   </div>
   <Link href={`/themes/${actif.slug}`} className={styles.voirChapitre}>{t.voirTout} ({actif.themes.length}) ↗</Link>
  </aside>
 </div>;
}
