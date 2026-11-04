"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { entree } from "@/donnees/catalogue";
import { hadithParId, ouvrageParId, texteDans, transmetteurParId } from "@/donnees/corpus";
import type { CategorieTransmetteur, Transmetteur } from "@/donnees/schemas/corpus";
import ui from "@/composants/Interface.module.css";
import styles from "@/composants/ChaineRapport.module.css";

const categories = {
  source: "legende.source",
  compagnon: "legende.compagnon",
  thiqa: "legende.thiqa",
  saduq: "legende.saduq",
  daif: "legende.daif",
  compilateur: "legende.compilateur",
  "non-evalue": "legende.nonEvalue",
} as const satisfies Record<CategorieTransmetteur, string>;

const generations = {
  source: "generation.source",
  compagnon: "generation.compagnon",
  tabiiAine: "generation.tabiiAine",
  tabii: "generation.tabii",
  tabiiCadet: "generation.tabiiCadet",
  atbaTabiin: "generation.atbaTabiin",
  maitreCompilateur: "generation.maitreCompilateur",
  compilateur: "generation.compilateur",
} as const satisfies Record<NonNullable<Transmetteur["generation"]>, string>;

// Chaîne cliquable (tronc commun puis voies) et fiche du transmetteur choisi,
// mise en page de la capture du patron (cadres dorés, onglets Biographie / Fiabilité).
export default function ChaineRapport({ hadithId }: { hadithId: string }) {
  const locale = useLocale();
  const t = useTranslations("rapport");
  const tRecherche = useTranslations("recherche");
  const hadith = hadithParId(hadithId);
  const { tronc = [], voies = [] } = hadith?.chaine ?? {};
  const [selection, setSelection] = useState(tronc[tronc.length - 1] ?? "");
  const [onglet, setOnglet] = useState<"biographie" | "fiabilite">("biographie");
  if (!hadith) return null;

  // Chaque voie complète = tronc + transmetteurs propres ; sert aux maîtres et élèves « dans cette chaîne ».
  const chemins = voies.map((v) => [...tronc, ...v.transmetteurs]);
  const voisins = (id: string, decalage: -1 | 1) => [
    ...new Set(chemins.flatMap((c) => {
      const i = c.indexOf(id);
      const voisin = i === -1 ? undefined : c[i + decalage];
      return voisin ? [voisin] : [];
    })),
  ].flatMap((v) => transmetteurParId(v) ?? []);

  const ids = [...tronc, ...voies.flatMap((v) => v.transmetteurs)];
  // Un transmetteur non évalué interdit d'affirmer qu'aucun n'est faible.
  const aucunFaible = ids.every((id) => !["daif", "non-evalue"].includes(transmetteurParId(id)?.categorie ?? "non-evalue"));
  const choisi = transmetteurParId(selection);
  const pivot = transmetteurParId(tronc[tronc.length - 1] ?? "");

  const deces = (valeur: string) => {
    const [debut = valeur, fin] = valeur.replace("~", "").split("-");
    if (fin) return t("fiche.decesEntre", { debut, fin });
    return valeur.startsWith("~") ? t("fiche.decesVers", { annee: debut }) : t("fiche.deces", { annee: debut });
  };

  const bloc = (texte: Record<string, string>) => {
    const { tag, texte: contenu } = texteDans(texte, locale);
    return { lang: tag, dir: entree(tag)?.direction, children: contenu };
  };

  const noeud = (id: string, dernier: boolean, i: number) => {
    const tr = transmetteurParId(id);
    if (!tr) return null;
    return (
      <li key={id} className={styles.maillon} style={{ ["--i" as string]: i }}>
        <button
          type="button"
          className={`${styles.noeud} ${styles.porteur}`}
          data-categorie={tr.categorie}
          aria-pressed={selection === id}
          aria-controls="fiche-transmetteur"
          onClick={() => setSelection(id)}
        >
          <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomAr}`}>{tr.nomAr}</bdi>
          <bdi lang="ar-Latn" dir="ltr" className={styles.nomLatin}>{tr.nomTranslittere}</bdi>
          <span className={styles.categorie}>{t(categories[tr.categorie])} <span aria-hidden="true">↗</span></span>
        </button>
        {!dernier && (
          <svg className={styles.fleche} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </li>
    );
  };

  // Relation cliquable : ouvre la fiche du maître ou de l'élève.
  const relation = (tr: Transmetteur) => (
    <li key={tr.id}>
      <button type="button" className={styles.puceRelation} aria-controls="fiche-transmetteur" onClick={() => setSelection(tr.id)}>
        <bdi lang="ar-Latn" dir="ltr">{tr.nomTranslittere}</bdi> <span aria-hidden="true">↗</span>
      </button>
    </li>
  );
  const listeRelations = (liste: Transmetteur[]) => (liste.length ? <ul>{liste.map(relation)}</ul> : <p>{t("fiche.aucun")}</p>);

  return (
    <div className={styles.disposition}>
      <section className={`${ui.carte} ${styles.arbre} ${styles.cadreOr}`} aria-labelledby="titre-isnad">
        <div className={styles.entete}>
          <h2 id="titre-isnad">
            <svg className={styles.ornement} viewBox="0 0 40 40" aria-hidden="true">
              <path d="M20 4c3 5 3 9 0 12-3-3-3-7 0-12zM20 36c-3-5-3-9 0-12 3 3 3 7 0 12zM4 20c5-3 9-3 12 0-3 3-7 3-12 0zM36 20c-5 3-9 3-12 0 3-3 7-3 12 0zM8.7 8.7c5.6 1.5 8.4 4.3 8.5 8.5-4.2-.1-7-2.9-8.5-8.5zM31.3 31.3c-5.6-1.5-8.4-4.3-8.5-8.5 4.2.1 7 2.9 8.5 8.5zM31.3 8.7c-1.5 5.6-4.3 8.4-8.5 8.5.1-4.2 2.9-7 8.5-8.5zM8.7 31.3c1.5-5.6 4.3-8.4 8.5-8.5-.1 4.2-2.9 7-8.5 8.5z" />
              <circle cx="20" cy="20" r="3" />
            </svg>
            {t("isnad")}
          </h2>
          <p className={ui.discret}>{t("cliquer")}</p>
        </div>

        <p className={styles.guide}><span className={styles.info} aria-hidden="true">i</span><span>{t("isnadGuide")}</span></p>
        <div className={styles.stats} aria-label={t("isnad")}>
          <span><strong>{tronc.length}</strong> · {t("tronc")}</span>
          <span><strong>{voies.length}</strong> · {t("voies")}</span>
        </div>
        <ul className={styles.legende} aria-label={t("legende.titre")}>
          {(Object.keys(categories) as CategorieTransmetteur[]).map((c) => (
            <li key={c}><span className={`${styles.echantillon} ${styles.porteur}`} data-categorie={c} aria-hidden="true" />{t(categories[c])}</li>
          ))}
        </ul>

        <div className={styles.groupe}>
          <h3 className={styles.sousTitre}>{t("tronc")}</h3>
          <ol className={styles.suite}>{tronc.map((id, i) => noeud(id, i === tronc.length - 1, i))}</ol>
        </div>

        <div className={`${styles.groupe} ${styles.voies}`}>
          <h3 className={styles.sousTitre}>
            <svg className={styles.pictoTitre} viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4" /></svg>
            {t("voies")}{pivot && <> · <bdi lang="ar-Latn" dir="ltr">{pivot.nomTranslittere}</bdi></>}
          </h3>
          {voies.map((voie) => {
            const ouvrage = ouvrageParId(voie.ouvrage);
            return (
              <div key={voie.id} className={`${styles.groupe} ${styles.voie}`}>
                <p className={styles.libelleVoie}>
                  <svg className={styles.pictoTitre} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" /></svg>
                  {t("voie", { reference: tRecherche("numero", { ouvrage: ouvrage?.nom ?? voie.ouvrage, numero: voie.numero }) })}
                </p>
                <ol className={styles.suite}>
                  {voie.transmetteurs.map((id, i) => noeud(id, i === voie.transmetteurs.length - 1, i))}
                </ol>
              </div>
            );
          })}
          <p className={styles.autres}>{t("autresVoies")}</p>
        </div>
        {aucunFaible && <p className={ui.discret}>{t("aucunFaible")}</p>}
      </section>

      {choisi && (
        <aside
          id="fiche-transmetteur"
          className={`${ui.carte} ${styles.fiche} ${styles.porteur} ${styles.cadreOr}`}
          data-categorie={choisi.categorie}
          aria-labelledby="titre-fiche"
          aria-live="polite"
        >
          <div className={styles.identite}>
            <p id="titre-fiche" className={styles.titreFiche}>
              <span className={styles.pictoFiche} aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19a6 6 0 0 1 12 0zM14 19a5 5 0 0 1 7-4.5V19z" /></svg>
              </span>
              {t("fiche.titre")}
            </p>
            <p lang="ar" dir="rtl" className={`texte-arabe ${styles.ficheNomAr}`}>{choisi.nomAr}</p>
            <p className={styles.ficheNomLatin}><bdi lang="ar-Latn" dir="ltr">{choisi.nomTranslittere}</bdi> <span aria-hidden="true">↗</span></p>
          </div>
          <div className={ui.badges}>
            <span className={`${ui.badge} ${styles.badgeCategorie} ${styles.porteur}`} data-categorie={choisi.categorie}>{t(categories[choisi.categorie])}</span>
            {choisi.generation && <span className={ui.badge}>{t(generations[choisi.generation])}</span>}
            {choisi.deces && <span className={ui.badge}>{deces(choisi.deces)}</span>}
            {choisi.ville && (
              <span className={ui.badge}>
                <bdi lang="ar" dir="rtl" className="texte-arabe">{choisi.ville.ar}</bdi>{" "}
                <bdi lang="ar-Latn" dir="ltr">({choisi.ville.translitteration})</bdi>
              </span>
            )}
          </div>

          <div className={styles.ongletsFiche} role="tablist" aria-label={t("fiche.onglets")}>
            <button type="button" role="tab" id="onglet-biographie" aria-selected={onglet === "biographie"} aria-controls="panneau-biographie" onClick={() => setOnglet("biographie")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" /></svg>
              {t("fiche.biographie")}
            </button>
            <button type="button" role="tab" id="onglet-fiabilite" aria-selected={onglet === "fiabilite"} aria-controls="panneau-fiabilite" onClick={() => setOnglet("fiabilite")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M6 20h12M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z" /></svg>
              {t("fiche.fiabilite")}
            </button>
          </div>

          <div id="panneau-biographie" role="tabpanel" aria-labelledby="onglet-biographie" hidden={onglet !== "biographie"} className={styles.panneauFiche}>
            <div className={styles.groupe}>
              <h3 className={styles.titreBloc}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C12 5 7 10 5 19M5 19l3-1M9 14c3 0 6-1 8-4" /></svg>
                {t("fiche.biographie")}
              </h3>
              <p {...bloc(choisi.biographie)} />
            </div>
            <div className={styles.groupe}>
              <h3 className={styles.titreBloc}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0" /></svg>
                {t("fiche.relations")}
              </h3>
              <div className={styles.relations}>
                <div>
                  <p className={styles.etiquetteRelation}>{t("fiche.maitres")}</p>
                  {listeRelations(voisins(choisi.id, -1))}
                </div>
                <div>
                  <p className={styles.etiquetteRelation}>{t("fiche.eleves")}</p>
                  {listeRelations(voisins(choisi.id, 1))}
                </div>
              </div>
            </div>
            <button type="button" className={styles.boutonOr} aria-controls="panneau-fiabilite" onClick={() => setOnglet("fiabilite")}>
              {t("fiche.voirFiabilite")} <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div id="panneau-fiabilite" role="tabpanel" aria-labelledby="onglet-fiabilite" hidden={onglet !== "fiabilite"} className={styles.panneauFiche}>
            {choisi.verdictAr && (
              <div className={styles.verdict}>
                <p className={styles.etiquette}>{t("fiche.verdict")}</p>
                <p lang="ar" dir="rtl" className={`texte-arabe ${styles.verdictAr}`}>{choisi.verdictAr}</p>
              </div>
            )}
            <div className={styles.groupe}>
              <h3 className={styles.titreBloc}>{t("fiche.jugements")}</h3>
              {choisi.jugements.length === 0 ? (
                <p className={styles.jugement}>{t("fiche.aucunJugement")}</p>
              ) : (
                choisi.jugements.map((j) => (
                  <div key={j.critique} className={styles.jugement} data-reserve={j.reserve || undefined}>
                    <p className={styles.critique}>
                      <bdi lang="ar-Latn" dir="ltr">{j.critique}</bdi>
                      {j.reserve && <span className={ui.badge} data-ton="alerte">{t("fiche.reserve")}</span>}
                    </p>
                    <p lang="ar" dir="rtl" className="texte-arabe">{j.verdictAr}</p>
                    <p {...bloc(j.explication)} />
                  </div>
                ))
              )}
            </div>
            {choisi.sources.length > 0 && (
              <div className={`${styles.groupe} ${styles.sources}`}>
                <h3 className={styles.etiquette}>{t("fiche.sources")}</h3>
                <ul>
                  {choisi.sources.map((s) => (
                    <li key={s.ouvrage}><bdi>{ouvrageParId(s.ouvrage)?.nom ?? s.ouvrage}</bdi> · {s.reference ?? t("fiche.referenceACompleter")}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p className={ui.avertissement}>{t("fiche.exemple")}</p>
        </aside>
      )}
    </div>
  );
}
