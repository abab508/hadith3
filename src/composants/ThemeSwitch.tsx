"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./ThemeSwitch.module.css";

type Mode = "auto" | "light" | "dark";
const STORAGE = "milaghaiba.apparence.mode.v1";
const MOTION = "milaghaiba.apparence.motion.v1";

export default function ThemeSwitch() {
  const t=useTranslations("apparence");
  const [mode,setMode]=useState<Mode>("auto");
  const [motion,setMotion]=useState(true);
  useEffect(()=>{
    try {
      const saved=window.localStorage.getItem(STORAGE);
      const initial:Mode=saved==="light"||saved==="dark"?saved:"auto";
      document.documentElement.dataset.theme=initial;
      setMode(initial);
      const allowed=window.localStorage.getItem(MOTION)!=="off";
      document.documentElement.dataset.motion=allowed?"on":"off";
      setMotion(allowed);
    }catch{
      document.documentElement.dataset.theme="auto";
      document.documentElement.dataset.motion="on";
    }
  },[]);
  function setTheme(next:Mode) {
    setMode(next);
    document.documentElement.dataset.theme=next;
    try {window.localStorage.setItem(STORAGE,next);}catch{/* réglage local facultatif */}
  }
  function toggle() {
    const next=!motion;setMotion(next);
    document.documentElement.dataset.motion=next?"on":"off";
    try {window.localStorage.setItem(MOTION,next?"on":"off");}catch{}
  }
  return (
    <div className={styles.controls} role="group" aria-label={t("titre")}>
      <span className={styles.label}>{t("titre")}</span>
      <div className={styles.segment}>
        {(["auto","light","dark"] as const).map(value=>(
          <button key={value} type="button" className={styles.choice}
            aria-pressed={mode===value} data-selected={mode===value} onClick={()=>setTheme(value)}>
            <span aria-hidden="true">{value==="auto"?"◐":value==="light"?"☼":"☾"}</span>
            <span>{value==="auto"?t("auto"):value==="light"?t("clair"):t("sombre")}</span>
          </button>
        ))}
      </div>
      <button className={styles.motion} aria-label={motion?t("reduire"):t("activer")}
        title={motion?t("reduire"):t("activer")} aria-pressed={!motion} type="button" onClick={toggle}>
        <span aria-hidden="true">{motion?"✦":"Ⅱ"}</span>
      </button>
    </div>
  );
}
