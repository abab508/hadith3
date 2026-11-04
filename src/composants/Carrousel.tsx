"use client";

import { useRef, type ReactNode } from "react";
import styles from "@/composants/Pages.module.css";

// Bande défilante de cartes, avec flèches précédent / suivant (le défilement au doigt reste possible).
export default function Carrousel({ precedent, suivant, children }: { precedent: string; suivant: string; children: ReactNode }) {
  const piste = useRef<HTMLUListElement>(null);
  const defiler = (sens: 1 | -1) => {
    const el = piste.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollBy({ left: sens * rtl * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className={styles.carrousel}>
      <button type="button" className={`${styles.flecheCarrousel} ${styles.flechePrecedent}`} aria-label={precedent} onClick={() => defiler(-1)}>‹</button>
      <ul ref={piste} className={styles.piste}>{children}</ul>
      <button type="button" className={`${styles.flecheCarrousel} ${styles.flecheSuivant}`} aria-label={suivant} onClick={() => defiler(1)}>›</button>
    </div>
  );
}
