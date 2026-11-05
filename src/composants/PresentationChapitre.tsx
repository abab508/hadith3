"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "@/composants/PresentationChapitre.module.css";

// Présentation animée d'un chapitre (diaporama des illustrations et des titres) avec lecture
// par la voix de synthèse du navigateur. Aucune vidéo ni voix enregistrée n'est inventée.
export default function PresentationChapitre({ diapos, lignes, langue, libelles }: {
  diapos: ReactNode[];
  lignes: string[];
  langue: string;
  libelles: { lancer: string; pause: string; ecouter: string; arreter: string; voix: string; sansVoix: string; diapo: string };
}) {
  const [i, setI] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [parle, setParle] = useState(false);
  const [voixOk, setVoixOk] = useState(true);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setVoixOk(typeof window !== "undefined" && "speechSynthesis" in window); }, []);
  useEffect(() => {
    if (!lecture) return;
    minuterie.current = setInterval(() => setI((n) => (n + 1) % Math.max(1, diapos.length)), 4500);
    return () => { if (minuterie.current) clearInterval(minuterie.current); };
  }, [lecture, diapos.length]);
  useEffect(() => () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const ecouter = () => {
    if (!voixOk) return;
    const s = window.speechSynthesis;
    if (parle) { s.cancel(); setParle(false); return; }
    s.cancel();
    const u = new SpeechSynthesisUtterance(lignes.join(". "));
    u.lang = langue;
    u.rate = 0.95;
    u.onend = () => setParle(false);
    u.onerror = () => setParle(false);
    setParle(true);
    setLecture(true);
    s.speak(u);
  };

  return (
    <div className={styles.presentation}>
      <div className={styles.scene} aria-live="polite">
        {diapos.map((d, n) => (
          <div key={n} className={styles.diapo} data-active={n === i} aria-hidden={n !== i} aria-label={`${libelles.diapo} ${n + 1} / ${diapos.length}`}>{d}</div>
        ))}
        <p className={styles.legende} key={i}>{lignes[i % Math.max(1, lignes.length)]}</p>
      </div>
      <div className={styles.commandes}>
        <button type="button" onClick={() => setLecture((v) => !v)} aria-pressed={lecture}>{lecture ? `❚❚ ${libelles.pause}` : `▶ ${libelles.lancer}`}</button>
        <button type="button" onClick={ecouter} disabled={!voixOk} aria-pressed={parle}>{parle ? `■ ${libelles.arreter}` : `🔊 ${libelles.ecouter}`}</button>
        <span className={styles.points}>{diapos.map((_, n) => <button key={n} type="button" aria-label={`${libelles.diapo} ${n + 1}`} aria-current={n === i} onClick={() => setI(n)} />)}</span>
      </div>
      <p className={styles.note}>{voixOk ? libelles.voix : libelles.sansVoix}</p>
    </div>
  );
}

// Bouton « écouter » pour un texte (hadith) : voix de synthèse du navigateur.
export function BoutonEcouter({ texte, langue, ecouter, arreter }: { texte: string; langue: string; ecouter: string; arreter: string }) {
  const [parle, setParle] = useState(false);
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk("speechSynthesis" in window); }, []);
  if (!ok) return null;
  return (
    <button type="button" className={styles.ecouter} aria-pressed={parle} onClick={() => {
      const s = window.speechSynthesis;
      if (parle) { s.cancel(); setParle(false); return; }
      s.cancel();
      const u = new SpeechSynthesisUtterance(texte);
      u.lang = langue; u.rate = 0.9;
      u.onend = () => setParle(false); u.onerror = () => setParle(false);
      setParle(true); s.speak(u);
    }}>{parle ? `■ ${arreter}` : `🔊 ${ecouter}`}</button>
  );
}
