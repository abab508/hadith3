"use client";

import {useEffect,useRef,useState} from "react";
import styles from "@/app/[locale]/themes/Themes.module.css";

type Bruit="eau"|"cloche"|"vent"|"papier";
const bruitParChapitre:Record<string,Bruit>={
 purification:"eau",priere:"cloche",jeune:"vent",croyance:"vent",
 famille:"papier",commerce:"cloche",comportement:"vent",
 eschatologie:"vent",science:"papier",zakat:"cloche",
 pelerinage:"vent",vie:"papier",sante:"eau",spiritualite:"vent",
 histoire:"papier",justice:"cloche"
};
const traductions={
 fr:{on:"Activer les ambiances sonores",off:"Couper les ambiances sonores",description:"Effets discrets au survol des chapitres, sans lecture automatique"},
 ar:{on:"تفعيل المؤثرات الصوتية",off:"إيقاف المؤثرات الصوتية",description:"أصوات خفيفة عند المرور على الموضوعات، دون تشغيل تلقائي"},
 en:{on:"Enable ambient sounds",off:"Mute ambient sounds",description:"Subtle chapter sounds on hover, no autoplay"}
} as const;

/** Générateur sonore autonome : aucune ressource audio externe. */
export default function SonsChapitres({langue}:{langue:"fr"|"ar"|"en"}){
 const [actif,setActif]=useState(false);
 const [disponible,setDisponible]=useState(true);
 const ctx=useRef<AudioContext|null>(null);
 const dernier=useRef(0);
 const t=traductions[langue];
 useEffect(()=>{
  const survol=(event:PointerEvent)=>{
   if(event.pointerType==="touch"||!ctx.current||ctx.current.state!=="running")return;
   const e=event.target;
   if(!(e instanceof Element))return;
   const carte=e.closest<HTMLElement>('[data-chapitre]');
   if(!carte||!actif)return;
   const depart=event.relatedTarget;
   if(depart instanceof Node&&carte.contains(depart))return;
   const slug=carte.dataset.chapitre||"";
   const type=bruitParChapitre[slug]??"vent";
   jouer(ctx.current,type,dernier);
  };
  document.addEventListener("pointerover",survol);
  return ()=>{document.removeEventListener("pointerover",survol);};
 },[actif]);
 useEffect(()=>()=>{if(ctx.current){void ctx.current.close();ctx.current=null;}},[]);
 async function basculer(){
  if(actif){setActif(false);await ctx.current?.suspend();return;}
  try{
   if(!ctx.current)ctx.current=new AudioContext();
   await ctx.current.resume();
   if(ctx.current.state==="running")setActif(true);
   else setDisponible(false);
  }catch{setDisponible(false);setActif(false);}
 }
 return <div className={styles.sonBouton}>
   <button type="button" aria-pressed={actif} disabled={!disponible}
     onClick={()=>{void basculer();}} title={t.description}>
     <span aria-hidden="true">{actif?"♪":"♫"}</span> {actif?t.off:t.on}
   </button>
   <span className={styles.sonAide}>{t.description}</span>
 </div>;
}
function jouer(ctx:AudioContext,type:Bruit,dernier:{current:number}){
 const maintenant=performance.now();
 if(maintenant-dernier.current<380)return;
 dernier.current=maintenant;
 const debut=ctx.currentTime,duree=type==="eau"?.8:.23;
 const sortie=ctx.createGain();
 sortie.gain.setValueAtTime(.0001,debut);
 sortie.gain.exponentialRampToValueAtTime(type==="eau"?.032:.018,debut+.045);
 sortie.gain.exponentialRampToValueAtTime(.0001,debut+duree);
 sortie.connect(ctx.destination);
 if(type==="eau"||type==="vent"||type==="papier"){
  const longueur=Math.floor(ctx.sampleRate*duree);
  const tampon=ctx.createBuffer(1,longueur,ctx.sampleRate);
  const data=tampon.getChannelData(0);
  let precedent=0;
  for(let i=0;i<longueur;i++){
   const aleatoire=Math.random()*2-1;
   precedent=(precedent+(type==="eau"?.065:type==="vent"?.012:.12)*(aleatoire-precedent));
   data[i]=type==="papier"?(aleatoire*.42+precedent*.6):precedent;
  }
  const source=ctx.createBufferSource();source.buffer=tampon;
  const filtre=ctx.createBiquadFilter();filtre.type=type==="eau"?"bandpass":"lowpass";
  filtre.frequency.value=type==="eau"?1100:type==="papier"?1800:380;
  filtre.Q.value=.45;
  source.connect(filtre).connect(sortie);source.start(debut);
  source.onended=()=>{source.disconnect();filtre.disconnect();sortie.disconnect();};
 }else{
  const oscillateur=ctx.createOscillator();oscillateur.type="sine";
  oscillateur.frequency.setValueAtTime(650,debut);
  oscillateur.frequency.exponentialRampToValueAtTime(850,debut+.16);
  oscillateur.connect(sortie);oscillateur.start(debut);oscillateur.stop(debut+duree);
  oscillateur.onended=()=>{oscillateur.disconnect();sortie.disconnect();};
 }
}
