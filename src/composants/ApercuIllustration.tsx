"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import styles from "@/composants/ApercuIllustration.module.css";

export default function ApercuIllustration({ children, agrandie, titre, ouvrir, fermer }: {
  children: ReactNode; agrandie?: ReactNode; titre: string; ouvrir: string; fermer: string;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [ouverte, setOuverte] = useState(false);
  return (
    <>
      <button ref={bouton} type="button" className={styles.apercu} aria-label={ouvrir}
        onClick={() => { setOuverte(true); dialogue.current?.showModal(); }}>
        {children}
        <svg className={styles.icone} viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5" /></svg>
      </button>
      <dialog ref={dialogue} className={styles.dialogue} aria-labelledby={id}
        onClose={() => { setOuverte(false); bouton.current?.focus(); }}
        onClick={(event) => { if (event.target === event.currentTarget) dialogue.current?.close(); }}>
        <div className={styles.entete}>
          <h2 id={id}>{titre}</h2>
          <button type="button" aria-label={fermer} onClick={() => dialogue.current?.close()}>×</button>
        </div>
        <div className={styles.grand}>{ouverte ? (agrandie ?? children) : null}</div>
      </dialog>
    </>
  );
}
