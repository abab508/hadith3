"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ui from "@/composants/Interface.module.css";
import styles from "@/composants/ChaineRapport.module.css";

// Même mise en page que le rapport détaillé (capture du patron), pour une chaîne découpée
// automatiquement depuis le texte arabe : maillons « non évalués », fiche sans jugement inventé.
type Maillon = { nom: string; categorie: "source" | "non-evalue" | "compilateur" };

export default function ChaineTexteRapport({ maillons, recueil, jusquAuProphete }: { maillons: string[]; recueil: string; jusquAuProphete: boolean }) {
  const t = useTranslations("rapportTexte");
  const tr = useTranslations("rapport");
  // Ordre de lecture : du Prophète ﷺ vers le compilateur.
  const liste: Maillon[] = [
    ...(jusquAuProphete ? [{ nom: "النبي ﷺ", categorie: "source" as const }] : []),
    ...[...maillons].reverse().map((nom) => ({ nom, categorie: "non-evalue" as const })),
    { nom: recueil, categorie: "compilateur" as const },
  ];
  const premierTransmetteur = liste.findIndex((m) => m.categorie === "non-evalue");
  const [choix, setChoix] = useState(premierTransmetteur >= 0 ? premierTransmetteur : 0);
  const [onglet, setOnglet] = useState<"biographie" | "fiabilite">("biographie");
  const choisi = liste[choix] ?? liste[0]!;
  const maitre = liste[choix - 1];
  const eleve = liste[choix + 1];
  const legendes = { source: tr("legende.source"), "non-evalue": tr("legende.nonEvalue"), compilateur: t("recueil") };

  const carte = (m: Maillon, i: number) => (
    <li key={`${i}-${m.nom}`} className={styles.maillon} style={{ ["--i" as string]: i }}>
      <button type="button" className={`${styles.noeud} ${styles.porteur}`} data-categorie={m.categorie} aria-pressed={choix === i}
        aria-controls="fiche-transmetteur" onClick={() => { setChoix(i); setOnglet("biographie"); }}>
        {m.categorie === "compilateur"
          ? <bdi lang="ar-Latn" dir="ltr" className={styles.nomLatin}>{m.nom}</bdi>
          : <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomAr}`}>{m.nom}</bdi>}
        <span className={styles.categorie}>{legendes[m.categorie]} <span aria-hidden="true">↗</span></span>
      </button>
      {i < liste.length - 1 && (
        <svg className={styles.fleche} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      )}
    </li>
  );
  const relation = (m: Maillon | undefined) => m ? (
    <ul><li><button type="button" className={styles.puceRelation} aria-controls="fiche-transmetteur" onClick={() => setChoix(liste.indexOf(m))}>
      <bdi lang={m.categorie === "compilateur" ? "ar-Latn" : "ar"} dir={m.categorie === "compilateur" ? "ltr" : "rtl"}>{m.nom}</bdi> <span aria-hidden="true">↗</span>
    </button></li></ul>
  ) : <p>{tr("fiche.aucun")}</p>;

  return (
    <div className={styles.disposition}>
      <section className={`${ui.carte} ${styles.arbre} ${styles.cadreOr}`} aria-labelledby="titre-isnad-texte">
        <div className={styles.entete}>
          <h2 id="titre-isnad-texte">
            <svg className={styles.ornement} viewBox="0 0 40 40" aria-hidden="true">
              <path d="M20 4c3 5 3 9 0 12-3-3-3-7 0-12zM20 36c-3-5-3-9 0-12 3 3 3 7 0 12zM4 20c5-3 9-3 12 0-3 3-7 3-12 0zM36 20c-5 3-9 3-12 0 3-3 7-3 12 0zM8.7 8.7c5.6 1.5 8.4 4.3 8.5 8.5-4.2-.1-7-2.9-8.5-8.5zM31.3 31.3c-5.6-1.5-8.4-4.3-8.5-8.5 4.2.1 7 2.9 8.5 8.5zM31.3 8.7c-1.5 5.6-4.3 8.4-8.5 8.5.1-4.2 2.9-7 8.5-8.5zM8.7 31.3c1.5-5.6 4.3-8.4 8.5-8.5-.1 4.2-2.9 7-8.5 8.5z" />
              <circle cx="20" cy="20" r="3" />
            </svg>
            {t("chaine")}
          </h2>
          <p className={ui.discret}>{tr("cliquer")}</p>
        </div>
        <p className={styles.guide}><span className={styles.info} aria-hidden="true">i</span><span>{t("guide")}</span></p>
        <div className={styles.stats}>
          <span>{t("maillonsCompte", { count: maillons.length })}</span>
        </div>
        <ul className={styles.legende} aria-label={tr("legende.titre")}>
          {(["source", "non-evalue", "compilateur"] as const).map((c) => (
            <li key={c}><span className={`${styles.echantillon} ${styles.porteur}`} data-categorie={c} aria-hidden="true" />{legendes[c]}</li>
          ))}
        </ul>
        <div className={styles.groupe}>
          <h3 className={styles.sousTitre}>{t("ordre")}</h3>
          <ol className={styles.suite}>{liste.map(carte)}</ol>
        </div>
        {!jusquAuProphete && <p className={ui.discret}>{t("nonProphete")}</p>}
      </section>

      <aside id="fiche-transmetteur" className={`${ui.carte} ${styles.fiche} ${styles.porteur} ${styles.cadreOr}`} data-categorie={choisi.categorie} aria-labelledby="titre-fiche-texte" aria-live="polite">
        <div className={styles.identite}>
          <p id="titre-fiche-texte" className={styles.titreFiche}>
            <span className={styles.pictoFiche} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19a6 6 0 0 1 12 0zM14 19a5 5 0 0 1 7-4.5V19z" /></svg></span>
            {tr("fiche.titre")}
          </p>
          {choisi.categorie === "compilateur"
            ? <p className={styles.ficheNomLatin}><bdi lang="ar-Latn">{choisi.nom}</bdi></p>
            : <p lang="ar" dir="rtl" className={`texte-arabe ${styles.ficheNomAr}`}>{choisi.nom}</p>}
        </div>
        <div className={ui.badges}>
          <span className={`${ui.badge} ${styles.badgeCategorie} ${styles.porteur}`} data-categorie={choisi.categorie}>{legendes[choisi.categorie]}</span>
          <span className={ui.badge}>{t("position", { rang: choix + 1, total: liste.length })}</span>
        </div>
        <div className={styles.ongletsFiche} role="tablist" aria-label={tr("fiche.onglets")}>
          <button type="button" role="tab" id="onglet-bio-texte" aria-selected={onglet === "biographie"} aria-controls="panneau-bio-texte" onClick={() => setOnglet("biographie")}>{tr("fiche.biographie")}</button>
          <button type="button" role="tab" id="onglet-fiab-texte" aria-selected={onglet === "fiabilite"} aria-controls="panneau-fiab-texte" onClick={() => setOnglet("fiabilite")}>{tr("fiche.fiabilite")}</button>
        </div>
        <div id="panneau-bio-texte" role="tabpanel" aria-labelledby="onglet-bio-texte" hidden={onglet !== "biographie"} className={styles.panneauFiche}>
          <div className={styles.groupe}>
            <h3 className={styles.titreBloc}>{tr("fiche.biographie")}</h3>
            <p>{choisi.categorie === "source" ? t("prophete") : choisi.categorie === "compilateur" ? t("rangCompilateur") : t("ficheVide")}</p>
          </div>
          <div className={styles.groupe}>
            <h3 className={styles.titreBloc}>{tr("fiche.relations")}</h3>
            <div className={styles.relations}>
              <div><p className={styles.etiquetteRelation}>{tr("fiche.maitres")}</p>{relation(maitre)}</div>
              <div><p className={styles.etiquetteRelation}>{tr("fiche.eleves")}</p>{relation(eleve)}</div>
            </div>
          </div>
          {choisi.categorie === "non-evalue" && (
            <button type="button" className={styles.boutonOr} aria-controls="panneau-fiab-texte" onClick={() => setOnglet("fiabilite")}>{tr("fiche.voirFiabilite")} <span aria-hidden="true">↗</span></button>
          )}
        </div>
        <div id="panneau-fiab-texte" role="tabpanel" aria-labelledby="onglet-fiab-texte" hidden={onglet !== "fiabilite"} className={styles.panneauFiche}>
          <h3 className={styles.titreBloc}>{tr("fiche.jugements")}</h3>
          <p className={styles.jugement}>{tr("fiche.aucunJugement")}</p>
        </div>
        <p className={ui.avertissement}>{t("aide")}</p>
      </aside>
    </div>
  );
}
