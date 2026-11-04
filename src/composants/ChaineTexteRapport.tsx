"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MaillonKg } from "@/donnees/fiches-kg";
import ui from "@/composants/Interface.module.css";
import styles from "@/composants/ChaineRapport.module.css";

// Même mise en page que le rapport détaillé (capture du patron). Deux sources possibles :
// - fiches : chaîne identifiée dans hadith-kg (CC BY 4.0), avec biographies et jugements cités ;
// - maillons : chaîne découpée automatiquement du texte arabe, sans fiche ni jugement.
type Categorie = "source" | "compagnon" | "thiqa" | "saduq" | "daif" | "compilateur" | "non-evalue";
type Maillon = { nom: string; categorie: Categorie; fiche?: MaillonKg };

export default function ChaineTexteRapport({ maillons = [], fiches, categories = [], recueil, jusquAuProphete }: {
  maillons?: string[]; fiches?: MaillonKg[]; categories?: Categorie[]; recueil: string; jusquAuProphete: boolean;
}) {
  const t = useTranslations("rapportTexte");
  const tr = useTranslations("rapport");
  const identifiee = !!fiches?.length;
  const liste: Maillon[] = [
    ...(jusquAuProphete ? [{ nom: "النبي ﷺ", categorie: "source" as const }] : []),
    ...(identifiee
      ? fiches!.map((f, i) => ({ nom: f.kunya ?? f.nom, categorie: categories[i] ?? ("non-evalue" as const), fiche: f }))
      : [...maillons].reverse().map((nom) => ({ nom, categorie: "non-evalue" as const }))),
    ...(identifiee ? [] : [{ nom: recueil, categorie: "compilateur" as const }]),
  ];
  const premier = liste.findIndex((m) => m.categorie !== "source");
  const [choix, setChoix] = useState(premier >= 0 ? premier : 0);
  const [onglet, setOnglet] = useState<"biographie" | "fiabilite">("biographie");
  const choisi = liste[choix] ?? liste[0]!;
  const maitre = liste[choix - 1];
  const eleve = liste[choix + 1];
  const libelle = (c: Categorie) => c === "compilateur" ? (identifiee ? t("auteurRecueil") : t("recueil"))
    : c === "non-evalue" ? tr("legende.nonEvalue")
    : c === "source" ? tr("legende.source") : c === "compagnon" ? tr("legende.compagnon")
    : c === "thiqa" ? tr("legende.thiqa") : c === "saduq" ? tr("legende.saduq") : tr("legende.daif");
  const presentes = [...new Set(liste.map((m) => m.categorie))];
  const arabe = (m: Maillon) => !(m.categorie === "compilateur" && !m.fiche);
  const f = choisi.fiche;

  const carte = (m: Maillon, i: number) => (
    <li key={`${i}-${m.nom}`} className={styles.maillon} style={{ ["--i" as string]: i }}>
      <button type="button" className={`${styles.noeud} ${styles.porteur}`} data-categorie={m.categorie} aria-pressed={choix === i}
        aria-controls="fiche-transmetteur" onClick={() => { setChoix(i); setOnglet("biographie"); }}>
        {arabe(m)
          ? <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomAr}`}>{m.nom}</bdi>
          : <bdi lang="ar-Latn" dir="ltr" className={styles.nomLatin}>{m.nom}</bdi>}
        {m.fiche?.rang && <bdi lang="ar" dir="rtl" className={styles.nomLatin}>{m.fiche.rang.length > 34 ? `${m.fiche.rang.slice(0, 34)}…` : m.fiche.rang}</bdi>}
        <span className={styles.categorie}>{libelle(m.categorie)} <span aria-hidden="true">↗</span></span>
      </button>
      {i < liste.length - 1 && (
        <svg className={styles.fleche} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      )}
    </li>
  );
  const relation = (m: Maillon | undefined) => m ? (
    <ul><li><button type="button" className={styles.puceRelation} aria-controls="fiche-transmetteur" onClick={() => setChoix(liste.indexOf(m))}>
      <bdi lang={arabe(m) ? "ar" : "ar-Latn"} dir={arabe(m) ? "rtl" : "ltr"}>{m.nom}</bdi> <span aria-hidden="true">↗</span>
    </button></li></ul>
  ) : <p>{tr("fiche.aucun")}</p>;
  const ligne = (etiquette: string, valeur: string | number | undefined) => valeur === undefined || valeur === "" ? null : (
    <div><dt>{etiquette}</dt><dd><bdi dir="auto">{valeur}</bdi></dd></div>
  );

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
        <p className={styles.guide}><span className={styles.info} aria-hidden="true">i</span><span>{identifiee ? t("guideKg") : t("guide")}</span></p>
        <div className={styles.stats}><span>{t("maillonsCompte", { count: identifiee ? fiches!.length : maillons.length })}</span></div>
        <ul className={styles.legende} aria-label={tr("legende.titre")}>
          {presentes.map((c) => <li key={c}><span className={`${styles.echantillon} ${styles.porteur}`} data-categorie={c} aria-hidden="true" />{libelle(c)}</li>)}
        </ul>
        <div className={styles.groupe}>
          <h3 className={styles.sousTitre}>{t("ordre")}</h3>
          <ol className={styles.suite}>{liste.map(carte)}</ol>
        </div>
        {!jusquAuProphete && <p className={ui.discret}>{t("nonProphete")}</p>}
        {identifiee && <p className={ui.discret}>{t("sourceKg")}</p>}
      </section>

      <aside id="fiche-transmetteur" className={`${ui.carte} ${styles.fiche} ${styles.porteur} ${styles.cadreOr}`} data-categorie={choisi.categorie} aria-labelledby="titre-fiche-texte" aria-live="polite">
        <div className={styles.identite}>
          <p id="titre-fiche-texte" className={styles.titreFiche}>
            <span className={styles.pictoFiche} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19a6 6 0 0 1 12 0zM14 19a5 5 0 0 1 7-4.5V19z" /></svg></span>
            {tr("fiche.titre")}
          </p>
          {arabe(choisi)
            ? <p lang="ar" dir="rtl" className={`texte-arabe ${styles.ficheNomAr}`}>{choisi.nom}</p>
            : <p className={styles.ficheNomLatin}><bdi lang="ar-Latn">{choisi.nom}</bdi></p>}
        </div>
        <div className={ui.badges}>
          <span className={`${ui.badge} ${styles.badgeCategorie} ${styles.porteur}`} data-categorie={choisi.categorie}>{libelle(choisi.categorie)}</span>
          {f?.tabaqa !== undefined && <span className={ui.badge}>{t("tabaqa")} {f.tabaqa}</span>}
          {f?.deces && <span className={ui.badge}>{t("deces")} {t("annee", { annee: f.deces })}</span>}
          {f?.residence && <span className={ui.badge}><bdi lang="ar" dir="rtl">{f.residence.split("،")[0]?.split(",")[0]?.trim()}</bdi></span>}
        </div>
        <div className={styles.ongletsFiche} role="tablist" aria-label={tr("fiche.onglets")}>
          <button type="button" role="tab" id="onglet-bio-texte" aria-selected={onglet === "biographie"} aria-controls="panneau-bio-texte" onClick={() => setOnglet("biographie")}>{tr("fiche.biographie")}</button>
          <button type="button" role="tab" id="onglet-fiab-texte" aria-selected={onglet === "fiabilite"} aria-controls="panneau-fiab-texte" onClick={() => setOnglet("fiabilite")}>{tr("fiche.fiabilite")}</button>
        </div>

        <div id="panneau-bio-texte" role="tabpanel" aria-labelledby="onglet-bio-texte" hidden={onglet !== "biographie"} className={styles.panneauFiche}>
          <div className={styles.groupe}>
            <h3 className={styles.titreBloc}>{tr("fiche.biographie")}</h3>
            {f ? (
              <dl className={styles.relations} lang="ar">
                {ligne(t("nomComplet"), f.nom)}
                {ligne(t("kunya"), f.kunya)}
                {ligne(t("tabaqa"), f.tabaqa)}
                {ligne(t("naissance"), f.naissance ? t("annee", { annee: f.naissance }) : undefined)}
                {ligne(t("deces"), f.deces ? t("annee", { annee: f.deces }) : undefined)}
                {ligne(t("nasab"), f.nasab?.replaceAll("،", "، "))}
                {ligne(t("residence"), f.residence)}
                {ligne(t("lieuDeces"), f.lieuDeces)}
                {ligne(t("riwayat"), f.riwayat)}
              </dl>
            ) : (
              <p>{choisi.categorie === "source" ? t("prophete") : choisi.categorie === "compilateur" ? t("rangCompilateur") : t("ficheVide")}</p>
            )}
            {f?.tadlis ? <p className={ui.discret}>{t("tadlis")}</p> : null}
            {f?.ikhtilat ? <p className={ui.discret}>{t("ikhtilat")}</p> : null}
            {f?.incomplet ? <p className={ui.discret}>{t("incomplet")}</p> : null}
          </div>
          <div className={styles.groupe}>
            <h3 className={styles.titreBloc}>{tr("fiche.relations")}</h3>
            <div className={styles.relations}>
              <div><p className={styles.etiquetteRelation}>{tr("fiche.maitres")}</p>{relation(maitre)}</div>
              <div><p className={styles.etiquetteRelation}>{tr("fiche.eleves")}</p>{relation(eleve)}</div>
            </div>
          </div>
          {choisi.categorie !== "source" && (
            <button type="button" className={styles.boutonOr} aria-controls="panneau-fiab-texte" onClick={() => setOnglet("fiabilite")}>{tr("fiche.voirFiabilite")} <span aria-hidden="true">↗</span></button>
          )}
        </div>

        <div id="panneau-fiab-texte" role="tabpanel" aria-labelledby="onglet-fiab-texte" hidden={onglet !== "fiabilite"} className={styles.panneauFiche}>
          {f?.rang && (
            <div className={styles.verdict}>
              <p className={styles.etiquette}>{t("synthese")}</p>
              <p lang="ar" dir="rtl" className={`texte-arabe ${styles.verdictAr}`}>{f.rang}</p>
            </div>
          )}
          <h3 className={styles.titreBloc}>{tr("fiche.jugements")}</h3>
          {f && f.jugements.length > 0 ? (
            f.jugements.map((j, i) => (
              <div key={`${i}-${j.critique}`} className={styles.jugement}>
                <p className={styles.critique}><bdi lang="ar" dir="rtl">{j.critique}</bdi></p>
                <p lang="ar" dir="rtl" className="texte-arabe">{j.texte}</p>
              </div>
            ))
          ) : (
            <p className={styles.jugement}>{f ? t("aucunJugementKg") : tr("fiche.aucunJugement")}</p>
          )}
        </div>
        <p className={ui.avertissement}>{identifiee ? t("sourceKg") : t("aide")}</p>
      </aside>
    </div>
  );
}
