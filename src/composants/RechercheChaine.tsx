"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { entree } from "@/donnees/catalogue";
import { corpus, ouvrageParId, texteDans, transmetteurParId } from "@/donnees/corpus";
import type { Bibliotheque } from "@/donnees/schemas/corpus";
import { Link } from "@/i18n/navigation";
import ui from "@/composants/Interface.module.css";
import styles from "@/composants/RechercheChaine.module.css";

const acces = {
  "licence-ouverte": "acces.licenceOuverte",
  "api-accord": "acces.apiAccord",
  "a-valider": "acces.aValider",
  "a-verifier": "acces.aVerifier",
} as const satisfies Record<Bibliotheque["acces"], string>;

const tousLesOuvrages = corpus.bibliotheques.flatMap((b) => b.ouvrages.map((o) => o.id));

// Formulaire en trois étapes : hadith, transmetteurs connus, bibliothèques et ouvrages.
export default function RechercheChaine({ hadithInitial }: { hadithInitial: string }) {
  const locale = useLocale();
  const t = useTranslations("chaine");
  const tRecherche = useTranslations("recherche");
  const [hadithId, setHadithId] = useState(hadithInitial);
  const [chaine, setChaine] = useState<string[]>([]);
  const [saisie, setSaisie] = useState("");
  const [faibles, setFaibles] = useState(true);
  const [bibliotheques, setBibliotheques] = useState(
    () => new Set(corpus.bibliotheques.filter((b) => b.parDefaut).map((b) => b.id))
  );
  const [ouvrages, setOuvrages] = useState(() => new Set(tousLesOuvrages));

  const basculer = (ensemble: Set<string>, id: string) => {
    const copie = new Set(ensemble);
    if (!copie.delete(id)) copie.add(id);
    return copie;
  };

  // Ajoute le transmetteur dès que la saisie correspond exactement à un nom (arabe ou translittéré).
  const saisir = (valeur: string) => {
    const cherche = valeur.trim().normalize("NFC");
    const trouve = corpus.transmetteurs.find((x) => x.nomAr === cherche || x.nomTranslittere === cherche);
    if (trouve && !chaine.includes(trouve.id)) {
      setChaine([...chaine, trouve.id]);
      setSaisie("");
    } else {
      setSaisie(valeur);
    }
  };

  const actives = corpus.bibliotheques.filter((b) => bibliotheques.has(b.id));
  const choisis = actives.flatMap((b) => b.ouvrages.filter((o) => ouvrages.has(o.id)));

  const pastilles = (liste: { id: string; nom: string; nomAr: string }[]) => (
    <ul className={styles.pastilles}>
      {liste.map((o) => (
        <li key={o.id}>
          <button
            type="button"
            className={styles.pastille}
            aria-pressed={ouvrages.has(o.id)}
            onClick={() => setOuvrages(basculer(ouvrages, o.id))}
          >
            <bdi lang="ar-Latn">{o.nom}</bdi>{" "}
            <bdi lang="ar" dir="rtl" className="texte-arabe">{o.nomAr}</bdi>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <section className={`${ui.carte} ${styles.etape}`} aria-labelledby="etape-1">
        <h2 id="etape-1" className={styles.titreEtape}>{t("etape1")}</h2>
        <ul className={styles.hadiths}>
          {corpus.hadiths.map((h) => {
            const occ = h.occurrences.find((o) => o.correspondance === "original") ?? h.occurrences[0]!;
            return (
              <li key={h.id}>
                <button
                  type="button"
                  className={styles.hadith}
                  aria-pressed={hadithId === h.id}
                  onClick={() => setHadithId(h.id)}
                >
                  <span className={styles.reference}>
                    {tRecherche("numero", { ouvrage: ouvrageParId(occ.ouvrage)?.nom ?? occ.ouvrage, numero: occ.numero })}
                  </span>
                  <span lang="ar" dir="rtl" className={`texte-arabe ${styles.texteHadith}`}>{h.texteAr}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <form role="search" action={`/${locale}/recherche`} method="get" className={ui.champ}>
          <label htmlFor="coller">{t("coller")}</label>
          <input id="coller" name="q" type="search" dir="auto" />
        </form>
      </section>

      <section className={`${ui.carte} ${styles.etape}`} aria-labelledby="etape-2">
        <h2 id="etape-2" className={styles.titreEtape}>{t("etape2")}</h2>
        <p>{t("etape2Aide")}</p>
        <div className={styles.chaine}>
          {chaine.length > 0 && (
            <ol className={styles.maillons}>
              {chaine.map((id) => {
                const tr = transmetteurParId(id);
                if (!tr) return null;
                return (
                  <li key={id} className={styles.maillon}>
                    <bdi lang="ar" dir="rtl" className="texte-arabe">{tr.nomAr}</bdi>
                    <button
                      type="button"
                      className={styles.retirer}
                      aria-label={t("retirer", { nom: tr.nomTranslittere })}
                      onClick={() => setChaine(chaine.filter((x) => x !== id))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          <div className={`${ui.champ} ${styles.ajout}`}>
            <label htmlFor="ajout-transmetteur">{t("ajouter")}</label>
            <input
              id="ajout-transmetteur"
              type="text"
              dir="auto"
              list="liste-transmetteurs"
              autoComplete="off"
              value={saisie}
              onChange={(e) => saisir(e.currentTarget.value)}
            />
            <datalist id="liste-transmetteurs">
              {corpus.transmetteurs.filter((x) => !chaine.includes(x.id)).map((x) => (
                <option key={x.id} value={x.nomTranslittere}>{x.nomAr}</option>
              ))}
            </datalist>
          </div>
        </div>
        <label className={styles.case}>
          <input type="checkbox" checked={faibles} onChange={(e) => setFaibles(e.currentTarget.checked)} />
          {t("faibles")}
        </label>
      </section>

      <section className={`${ui.carte} ${styles.etape}`} aria-labelledby="etape-3">
        <h2 id="etape-3" className={styles.titreEtape}>{t("etape3")}</h2>
        <div className={styles.bibliotheques}>
          {corpus.bibliotheques.map((b) => {
            const { tag, texte } = texteDans(b.description, locale);
            return (
              <label key={b.id} className={styles.bibliotheque}>
                <input
                  type="checkbox"
                  checked={bibliotheques.has(b.id)}
                  onChange={() => setBibliotheques(basculer(bibliotheques, b.id))}
                />
                <span className={styles.descriptif}>
                  <span className={styles.nomBibliotheque}>
                    <bdi>{b.nom}</bdi>
                    {b.nomAr !== b.nom && <> <bdi lang="ar" dir="rtl" className="texte-arabe">{b.nomAr}</bdi></>}
                  </span>
                  <span lang={tag} dir={entree(tag)?.direction}>{texte}</span>
                  <span className={ui.badge}>{t(acces[b.acces])}</span>
                </span>
              </label>
            );
          })}
        </div>

        {actives.filter((b) => b.ouvrages.length > 0).map((b) => (
          <div key={b.id} className={styles.groupe}>
            <h3>{t("ouvragesHadith", { bibliotheque: b.nom })}</h3>
            {pastilles(b.ouvrages.filter((o) => o.categorie === "hadith"))}
            <p className={ui.discret}>{t("tousLesAutres")}</p>
            <h3>{t("ouvragesRijal")}</h3>
            {pastilles(b.ouvrages.filter((o) => o.categorie === "rijal"))}
          </div>
        ))}
      </section>

      <div className={styles.envoi}>
        <Link
          href={`/rapport/${hadithId}`}
          className={`${ui.bouton} ${styles.generer}`}
          aria-describedby="resume-chaine"
        >
          {t("generer")}
          <svg className={styles.fleche} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <p id="resume-chaine" className={ui.discret} aria-live="polite">
          {t("resumeOuvrages", { count: choisis.length })} · {t("resumeBibliotheques", { count: actives.length })}
        </p>
      </div>
    </>
  );
}
