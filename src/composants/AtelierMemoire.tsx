"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  questionMemoire,
  type ExtraitMemorisation,
} from "@/donnees/memorisation";
import styles from "./AtelierMemoire.module.css";

type Mode = "lecture" | "quiz";
const CLE_PROGRESS = "milaghaiba.memorisation.progress.v1";

export default function AtelierMemoire({extraits}: {extraits: ExtraitMemorisation[]}) {
  const t=useTranslations("memorisation");
  const [index,setIndex]=useState(0);
  const [mode,setMode]=useState<Mode>("lecture");
  const [visible,setVisible]=useState(true);
  const [selection,setSelection]=useState<string|null>(null);
  const [connus,setConnus]=useState<string[]>([]);
  const [pret,setPret]=useState(false);
  useEffect(()=>{
    try {
      const value=JSON.parse(window.localStorage.getItem(CLE_PROGRESS)??"[]") as unknown;
      if(Array.isArray(value))setConnus(value.filter((x):x is string=>typeof x==="string"));
    } catch { /* stockage facultatif */ }
    setPret(true);
  },[]);
  const courant=extraits[index]??extraits[0];
  const exercice=courant?questionMemoire(courant,extraits):null;
  const juste=selection!==null && exercice!==null && selection===exercice.reponse;
  function changer(i:number) {
    setIndex(i);setMode("lecture");setVisible(true);setSelection(null);
  }
  function noter(connu:boolean) {
    if(!courant)return;
    const suivants=connu?[...new Set([...connus,courant.id])]:connus.filter(id=>id!==courant.id);
    setConnus(suivants);
    try{window.localStorage.setItem(CLE_PROGRESS,JSON.stringify(suivants));}catch{/* resté en mémoire */}
  }
  if(!courant)return <section className={styles.empty}>{t("aucun")}</section>;
  return (
    <div className={styles.page}>
      <div className={styles.aura} aria-hidden="true" />
      <section className={styles.intro}>
        <p className={styles.surtitre}><span aria-hidden="true">✧</span> MILAGHAIBA · {t("nav")}</p>
        <h1>{t("titre")}</h1>
        <p className={styles.accroche}>{t("intro")}</p>
        <p className={styles.aide}>{t("aide")}</p>
      </section>
      <section className={styles.choix} aria-label={t("choisir")}>
        <div className={styles.barre}>
          <h2>{t("choisir")}</h2>
          <span className={styles.compteur} role="status">
            ✦ {pret?connus.filter(id=>extraits.some(h=>h.id===id)).length:"—"} / {extraits.length} · {t("progression")}
          </span>
        </div>
        <div className={styles.liste}>
          {extraits.map((h,i)=>(
            <button className={styles.puce} data-active={i===index} aria-pressed={i===index}
              key={h.id} type="button" onClick={()=>changer(i)}>
              <span aria-hidden="true">{connus.includes(h.id)?"✓":"✦"}</span>
              <bdi dir="ltr">{i+1}</bdi>
              <span lang="ar" dir="rtl" className="texte-arabe">{h.ouvrageAr} {h.referenceNumero}</span>
            </button>
          ))}
        </div>
      </section>
      <section className={styles.espace} aria-label={t("texte")}>
        <div className={styles.enteteCarte}>
          <p className={styles.mini}>{t("texte")}</p>
          <span className={styles.statut}>{t("etat")}</span>
        </div>
        <p className={styles.reference}>{t("reference")} · <bdi lang="ar" dir="rtl" className="texte-arabe">{courant.ouvrageAr} · {courant.referenceNumero}</bdi></p>
        <div className={styles.onglets} role="group" aria-label={t("choisir")}>
          <button type="button" data-active={mode==="lecture"} aria-pressed={mode==="lecture"} onClick={()=>{setMode("lecture");setVisible(true);setSelection(null);}}>{t("lecture")}</button>
          <button type="button" data-active={mode==="quiz"} aria-pressed={mode==="quiz"} onClick={()=>{setMode("quiz");setSelection(null);}}>{t("quiz")}</button>
        </div>
        {mode==="lecture" ? (
          <div className={styles.cadreTexte}>
            <div className={styles.ornement} aria-hidden="true">۞</div>
            {visible ? <p lang="ar" dir="rtl" className={"texte-arabe "+styles.arabe} key={courant.id}>{courant.texteAr}</p>
              : <p className={styles.masque} aria-live="polite">✧ · · · ✧</p>}
            <button type="button" className={styles.action} onClick={()=>setVisible(v=>!v)}>
              {visible?t("masquer"):t("montrer")}
            </button>
          </div>
        ):exercice?(
          <div className={styles.quiz}>
            <h2>{t("question")}</h2>
            <p lang="ar" dir="rtl" className={"texte-arabe "+styles.arabe}>
              {exercice.avant} <span className={styles.trou} aria-label={t("quiz")}>﹏﹏﹏</span> {exercice.apres}
            </p>
            <div className={styles.reponses}>
              {exercice.propositions.map(option=>(
                <button type="button" disabled={selection!==null}
                  key={option} onClick={()=>setSelection(option)}
                  data-correct={selection===option?(juste?"true":"false"):undefined}
                  className={styles.reponse}>
                  <bdi lang="ar" dir="rtl" className="texte-arabe">{option}</bdi>
                </button>
              ))}
            </div>
            {selection!==null&&(
              <div role="status" aria-live="polite" className={styles.resultat}>
                <strong>{juste?t("correct"):t("incorrect")}</strong>
                <p>{t("reponse")} : <bdi lang="ar" dir="rtl" className="texte-arabe">{exercice.reponse}</bdi></p>
                <p lang="ar" dir="rtl" className={"texte-arabe "+styles.revelation}>{courant.texteAr}</p>
              </div>
            )}
          </div>
        ):<p>{t("aucun")}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={()=>noter(true)} aria-pressed={connus.includes(courant.id)}>✓ {t("marquer")}</button>
          <button type="button" className={styles.secondaire} onClick={()=>noter(false)} aria-pressed={!connus.includes(courant.id)}>{t("revoir")}</button>
          <button type="button" className={styles.secondaire} onClick={()=>changer((index+1)%extraits.length)}>{t("suivant")} <span aria-hidden="true">↗</span></button>
        </div>
        <Link className={styles.source} href={"/rapport/"+courant.id}>{t("source")} <span aria-hidden="true">↗</span></Link>
      </section>
      <aside className={styles.mention} role="note"><span aria-hidden="true">ⓘ</span> {t("avertissement")}</aside>
    </div>
  );
}
