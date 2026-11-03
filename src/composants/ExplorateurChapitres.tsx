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
const symboles:Record<string,string>={
 croyance:"☪",science:"✧",purification:"◉",priere:"۞",jeune:"☾",zakat:"♡",pelerinage:"⌂",famille:"❦",comportement:"❧",commerce:"⚖",vie:"✺",sante:"✶",spiritualite:"✦",histoire:"☼",justice:"◇",eschatologie:"⌛"
};
export default function ExplorateurChapitres({chapitres,langue}:{chapitres:Chapitre[];langue:Langue}){
 const [selection,setSelection]=useState("famille");
 const actif=chapitres.find(c=>c.slug===selection)??chapitres[0]!;
 const t=labels[langue];
 return <div className={styles.explorateur}>
  <div className={styles.grilleExplorer} role="group" aria-label={t.selection}>
   {chapitres.map((c,index)=><button key={c.slug} type="button" aria-pressed={c.slug===selection}
    onClick={()=>setSelection(c.slug)} className={`${styles.carteExplorer} ${styles[c.fond]} ${styles["theme"+c.slug]??""} ${c.slug===selection?styles.selectionnee:""}`}>
    <span className={styles.numero}> {String(index+1).padStart(2,"0")} </span>
    <span className={styles.pictogramme} aria-hidden="true">{symboles[c.slug]??"✦"}</span>
    <strong>{c.nom[langue]}</strong>
    {langue!=="ar"&&<span className={styles.nomAr} dir="rtl" lang="ar">{c.nom.ar}</span>}
   </button>)}
  </div>
  <aside className={`${styles.panneau} ${styles[actif.fond]}`} aria-label={t.selection} aria-live="polite">
   <span className={styles.panneauSymbole} aria-hidden="true">{symboles[actif.slug]??"✦"}</span>
   <p className={styles.panneauEyebrow}>{t.selection} · {String(chapitres.indexOf(actif)+1).padStart(2,"0")}/{chapitres.length}</p>
   <h3>{actif.nom[langue]}</h3>
   {langue!=="ar"&&<p className={styles.panneauAr} dir="rtl" lang="ar">{actif.nom.ar}</p>}
   <div className={styles.panneauDiviseur}><span>✧</span>{t.sousThemes}<span>✧</span></div>
   <div className={styles.listeThemes}>
    {actif.themes.slice(0,8).map(theme=><Link key={theme.slug}
     href={`/recherche?q=${encodeURIComponent(theme.nom.ar)}&mode=approximative`}
     title={t.recherche} className={styles.themeLien}><span>{theme.nom[langue]}</span><span aria-hidden="true">›</span></Link>)}
   </div>
   <Link href={`/themes/${actif.slug}`} className={styles.voirChapitre}>{t.voirTout} ({actif.themes.length}) ↗</Link>
  </aside>
 </div>;
}
