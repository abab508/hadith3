"use client";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./ActionsRapport.module.css";
import {libellesRapport} from "@/donnees/libelles-rapport";

/** Navigation partageable et sortie papier sans exposer les données à un service tiers. */
export default function ActionsRapport({reportHref,returnHref,print=false}:{
 reportHref?:string;returnHref?:string;print?:boolean;
}){
 const locale=useLocale();
 const t=libellesRapport(locale);
 return <nav aria-label={t.report} className={styles.actions}>
   <Link href="/" className={styles.accueil}>
     <span aria-hidden="true">⌂</span> {t.home}
   </Link>
   {returnHref&&<Link href={returnHref} className={styles.secondary}>← {t.back}</Link>}
   {reportHref&&<Link href={reportHref} className={styles.rapport}>
     <span aria-hidden="true">▤</span> {t.report} ↗
   </Link>}
   <Link href="/recherche" className={styles.secondary}>⌕ {t.search}</Link>
   {print&&<button type="button" className={styles.print} onClick={()=>window.print()}>
     <span aria-hidden="true">⎙</span> {t.print}
   </button>}
 </nav>;
}
