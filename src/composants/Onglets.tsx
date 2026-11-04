"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "@/composants/Pages.module.css";

// Onglets accessibles (flèches gauche/droite, Début, Fin), soulignement doré qui glisse.
export default function Onglets({ titre, onglets }: { titre: string; onglets: { cle: string; libelle: string; contenu: ReactNode }[] }) {
  const base = useId();
  const [actif, setActif] = useState(0);
  const clavier = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = onglets.length;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const suivant = rtl ? "ArrowLeft" : "ArrowRight";
    const precedent = rtl ? "ArrowRight" : "ArrowLeft";
    let i = actif;
    if (e.key === suivant) i = (actif + 1) % n;
    else if (e.key === precedent) i = (actif - 1 + n) % n;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = n - 1;
    else return;
    e.preventDefault();
    setActif(i);
    document.getElementById(`${base}-onglet-${i}`)?.focus();
  };
  return (
    <div className={styles.onglets}>
      <div role="tablist" aria-label={titre} className={styles.barreOnglets} onKeyDown={clavier}>
        {onglets.map((o, i) => (
          <button key={o.cle} id={`${base}-onglet-${i}`} type="button" role="tab" aria-selected={i === actif} aria-controls={`${base}-panneau-${i}`}
            tabIndex={i === actif ? 0 : -1} onClick={() => setActif(i)}>
            {o.libelle}
          </button>
        ))}
      </div>
      {onglets.map((o, i) => (
        <div key={o.cle} id={`${base}-panneau-${i}`} role="tabpanel" aria-labelledby={`${base}-onglet-${i}`} hidden={i !== actif} className={styles.panneau}>
          {o.contenu}
        </div>
      ))}
    </div>
  );
}
