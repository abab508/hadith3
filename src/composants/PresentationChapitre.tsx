"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "@/composants/PresentationChapitre.module.css";

// Présentation animée d'un chapitre (diaporama des illustrations et des titres), sans son :
// le patron a fait retirer toute lecture à voix haute et toute ambiance sonore (2026-11-05).
export default function PresentationChapitre({ diapos, lignes, libelles }: {
  diapos: ReactNode[];
  lignes: string[];
  libelles: { lancer: string; pause: string; diapo: string };
}) {
  const [i, setI] = useState(0);
  const [lecture, setLecture] = useState(false);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!lecture) return;
    minuterie.current = setInterval(() => setI((n) => (n + 1) % Math.max(1, diapos.length)), 4500);
    return () => { if (minuterie.current) clearInterval(minuterie.current); };
  }, [lecture, diapos.length]);

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
        <span className={styles.points}>{diapos.map((_, n) => <button key={n} type="button" aria-label={`${libelles.diapo} ${n + 1}`} aria-current={n === i} onClick={() => setI(n)} />)}</span>
      </div>
    </div>
  );
}
