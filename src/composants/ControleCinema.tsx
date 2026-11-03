"use client";

import {useEffect,useState} from "react";
import styles from "@/app/[locale]/themes/Themes.module.css";

const libelles={
 fr:{activer:"Activer les animations",desactiver:"Réduire les animations",note:"Effets cinématographiques facultatifs"},
 ar:{activer:"تشغيل الحركة",desactiver:"تقليل الحركة",note:"مؤثرات بصرية اختيارية"},
 en:{activer:"Enable animations",desactiver:"Reduce animations",note:"Optional cinematic effects"}
} as const;

/** Contrôle global, sans moteur tiers : préserve le mode mouvement réduit. */
export default function ControleCinema({langue}:{langue:"fr"|"ar"|"en"}){
 const [actif,setActif]=useState(false);
 useEffect(()=>{
  const html=document.documentElement;
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const adapter=()=>{if(media.matches){html.dataset.motion="off";setActif(false)}else if(html.dataset.motion!=="off"){html.dataset.motion="on";setActif(true)}};
  adapter();
  media.addEventListener("change",adapter);
  return ()=>media.removeEventListener("change",adapter);
 },[]);
 const t=libelles[langue];
 function basculer(){
  const prochain=!actif;
  document.documentElement.dataset.motion=prochain?"on":"off";
  setActif(prochain);
 }
 return <div className={styles.controleCinema}>
  <button type="button" aria-pressed={actif} onClick={basculer} title={t.note}>
   <span aria-hidden="true">{actif?"✦":"◌"}</span> {actif?t.desactiver:t.activer}
  </button>
 </div>;
}
