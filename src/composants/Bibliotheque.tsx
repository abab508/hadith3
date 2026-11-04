"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Rayon } from "@/donnees/recueils";
import type { FamilleRecueil } from "@/donnees/schemas/recueil";
import styles from "@/composants/Bibliotheque.module.css";

const titresFamilles = {
  neuf: "familles.neuf.titre",
  transmission: "familles.transmission.titre",
  musnad: "familles.musnad.titre",
  specialises: "familles.specialises.titre",
  compilations: "familles.compilations.titre",
  anciens: "familles.anciens.titre",
  imamite: "familles.imamite.titre",
  ibadite: "familles.ibadite.titre",
} as const satisfies Record<FamilleRecueil, string>;

const notesFamilles = {
  neuf: "familles.neuf.note",
  transmission: "familles.transmission.note",
  musnad: "familles.musnad.note",
  specialises: "familles.specialises.note",
  compilations: "familles.compilations.note",
  anciens: "familles.anciens.note",
  imamite: "familles.imamite.note",
  ibadite: "familles.ibadite.note",
} as const satisfies Record<FamilleRecueil, string>;

// Comparaison tolérante : sans accents latins ni voyelles brèves arabes, insensible à la casse.
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ًͯ-ْٰ‘’ʿʾ'ʿʾ‘’]/g, "")
    .replace(/[أإآ]/g, "ا")
    .toLowerCase();
}

export default function Bibliotheque({ rayons, requeteInitiale = "" }: { rayons: Rayon[]; requeteInitiale?: string }) {
  const t = useTranslations("bibliotheque");
  const [requete, setRequete] = useState(requeteInitiale);
  const [famille, setFamille] = useState<FamilleRecueil | "">("");

  const visibles = useMemo(() => {
    const q = normaliser(requete.trim());
    return rayons
      .filter((r) => !famille || r.famille === famille)
      .map((r) => ({
        ...r,
        recueils: q
          ? r.recueils.filter((l) => normaliser(`${l.nom} ${l.nomAr} ${l.auteur ?? ""}`).includes(q))
          : r.recueils,
      }))
      .filter((r) => r.recueils.length > 0);
  }, [rayons, requete, famille]);

  const nombre = visibles.reduce((somme, r) => somme + r.recueils.length, 0);

  return (
    <div className={styles.bibliotheque}>
      <div className={styles.outils}>
        <label className={styles.recherche}>
          <span className="visuellement-cache">{t("filtrer")}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="search"
            dir="auto"
            value={requete}
            placeholder={t("filtrer")}
            onChange={(e) => setRequete(e.currentTarget.value)}
          />
        </label>
        <div className={styles.puces} role="group" aria-label={t("toutes")}>
          <button type="button" aria-pressed={famille === ""} onClick={() => setFamille("")}>{t("toutes")}</button>
          {rayons.map((r) => (
            <button key={r.famille} type="button" aria-pressed={famille === r.famille} onClick={() => setFamille(r.famille)}>
              {t(titresFamilles[r.famille])}
            </button>
          ))}
        </div>
        <p className={styles.compteur} aria-live="polite">{t("compteur", { n: nombre })}</p>
      </div>

      {visibles.length === 0 && <p className={styles.aucun}>{t("aucun")}</p>}

      {visibles.map((rayon) => (
        <section key={rayon.famille} className={styles.rayon} data-famille={rayon.famille} aria-labelledby={`rayon-${rayon.famille}`}>
          <header className={styles.enteteRayon}>
            <h2 id={`rayon-${rayon.famille}`}>{t(titresFamilles[rayon.famille])}</h2>
            <p>{t(notesFamilles[rayon.famille])}</p>
          </header>
          <ol className={styles.etagere}>
            {rayon.recueils.map((livre, index) => (
              <li key={livre.id} className={styles.livre} style={{ ["--i" as string]: index % 12 }}>
                <article className={styles.couverture}>
                  <span className={styles.numero}>{livre.numero}</span>
                  <svg className={styles.ornement} viewBox="0 0 40 40" aria-hidden="true">
                    <rect x="9" y="9" width="22" height="22" rx="2" />
                    <rect x="9" y="9" width="22" height="22" rx="2" transform="rotate(45 20 20)" />
                    <circle cx="20" cy="20" r="3" />
                  </svg>
                  <h3 className={styles.titreLivre}>
                    <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomAr}`}>{livre.nomAr}</bdi>
                    <bdi lang="ar-Latn" dir="ltr" className={styles.nom}>{livre.nom}</bdi>
                  </h3>
                  <p className={styles.auteur}>
                    <span className="visuellement-cache">{t("auteur")} : </span>
                    {livre.auteur ? <bdi dir="ltr">{livre.auteur}</bdi> : <em>{t("auteurAbsent")}</em>}
                  </p>
                  {livre.lisible > 0 && (
                    <Link href={`/recueil/${livre.id}`} className={styles.chercher}>
                      {t("lire", { n: livre.lisible })} <span aria-hidden="true">↗</span>
                    </Link>
                  )}
                  {livre.cherchable && (
                    <Link href={`/recherche?recueil=${livre.id}`} className={styles.chercher}>
                      {t("cherchable")} <span aria-hidden="true">↗</span>
                    </Link>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
