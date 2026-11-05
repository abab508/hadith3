"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import IconeTheme from "@/composants/IconeTheme";
import ImageDecorative from "@/composants/ImageDecorative";
import type { Icone } from "@/donnees/themes";
import styles from "@/composants/Pages.module.css";

export type EntreeTheme = { id: string; numero: number; titre: string; icone: Icone; chapitres: { id: string; titre: string; image?: string; langue?: string }[] };

const normaliser = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f\u064b-\u0652]/g, "").toLowerCase();

// Liste en accordéon des thèmes et de leurs chapitres, filtrée par la recherche.
export default function ListeChapitres({ entrees, rechercher, aFournir }: { entrees: EntreeTheme[]; rechercher: string; aFournir: string }) {
  const [q, setQ] = useState("");
  const visibles = useMemo(() => {
    const n = normaliser(q.trim());
    if (!n) return entrees;
    return entrees
      .map((e) => (normaliser(e.titre).includes(n) ? e : { ...e, chapitres: e.chapitres.filter((c) => normaliser(c.titre).includes(n)) }))
      .filter((e) => normaliser(e.titre).includes(n) || e.chapitres.length > 0);
  }, [entrees, q]);

  return (
    <div className={styles.listeChapitres}>
      <label className={styles.champRecherche}>
        <span className="visuellement-cache">{rechercher}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <input type="search" dir="auto" placeholder={rechercher} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      </label>
      <ol className={styles.accordeon}>
        {visibles.map((e, i) => (
          <li key={e.id} style={{ ["--i" as string]: i }}>
            <details open={q.trim() !== "" && e.chapitres.length > 0}>
              <summary>
                <span className={styles.iconeLigne}><IconeTheme icone={e.icone} /></span>
                <span className={styles.titreLigne}>{e.numero}. {e.titre}</span>
                <span className={styles.chevron} aria-hidden="true">⌄</span>
              </summary>
              {e.chapitres.length > 0 ? (
                <ul className={styles.sousListe}>
                  {e.chapitres.map((c) => (
                    <li key={c.id}><Link href={`/chapitres/${c.id}`} className={styles.lienChapitreIllustre}>
                      {c.image && <span className={styles.vignetteChapitre}><ImageDecorative src={c.image} sizes="4.5rem" /></span>}
                      <bdi lang={c.langue} dir="auto">{c.titre}</bdi>
                    </Link></li>
                  ))}
                  <li><Link href={`/themes/${e.id}`} className={styles.lienTheme}>↗ {e.titre}</Link></li>
                </ul>
              ) : (
                <p className={styles.mentionListe}>{aFournir} · <Link href={`/themes/${e.id}`}>↗</Link></p>
              )}
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
