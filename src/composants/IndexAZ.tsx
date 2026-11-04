"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { EntreeIndex } from "@/donnees/index-az";
import styles from "@/composants/Pages.module.css";

type Libelles = { lettres: string; rechercher: string; aucun: string; toutes: string; theme: string; chapitre: string; recueil: string };

const normaliser = (s: string) => s.normalize("NFD").replace(/[̀-ًͯ-ْ]/g, "").toLowerCase();

// Grille de lettres + recherche ; les lettres sans entrée sont grisées.
export default function IndexAZ({ alphabet, entrees, libelles }: { alphabet: string[]; entrees: EntreeIndex[]; libelles: Libelles }) {
  const [lettre, setLettre] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const presentes = useMemo(() => new Set(entrees.map((e) => e.lettre)), [entrees]);
  const visibles = useMemo(() => {
    const n = normaliser(q.trim());
    return entrees
      .filter((e) => (!lettre || e.lettre === lettre) && (!n || normaliser(e.titre).includes(n)))
      .sort((a, b) => a.tri.localeCompare(b.tri));
  }, [entrees, lettre, q]);
  const montrer = lettre !== null || q.trim() !== "";
  const type = { theme: libelles.theme, chapitre: libelles.chapitre, recueil: libelles.recueil };

  return (
    <div className={styles.index}>
      <div role="group" aria-label={libelles.lettres} className={styles.lettres}>
        {alphabet.map((l, i) => (
          <button key={l} type="button" disabled={!presentes.has(l)} aria-pressed={lettre === l} style={{ ["--i" as string]: i }}
            onClick={() => setLettre(lettre === l ? null : l)}>{l}</button>
        ))}
      </div>
      <label className={styles.champRecherche}>
        <span className="visuellement-cache">{libelles.rechercher}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <input type="search" dir="auto" placeholder={libelles.rechercher} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      </label>
      {montrer && (
        <div className={styles.resultatsIndex} aria-live="polite">
          {lettre && <button type="button" className={styles.toutes} onClick={() => setLettre(null)}>{libelles.toutes}</button>}
          {visibles.length === 0 ? <p className={styles.mentionListe}>{libelles.aucun}</p> : (
            <ul>
              {visibles.map((e) => (
                <li key={`${e.type}-${e.href}`}>
                  <Link href={e.href}><span dir="auto">{e.titre}</span><span className={styles.typeEntree}>{type[e.type]}</span></Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
