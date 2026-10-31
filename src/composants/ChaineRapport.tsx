"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { entree } from "@/donnees/catalogue";
import { hadithParId, ouvrageParId, texteDans, transmetteurParId } from "@/donnees/corpus";
import type { CategorieTransmetteur, Transmetteur } from "@/donnees/schemas/corpus";
import { presenceDansHadith } from "@/donnees/presence-transmetteur";
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

// Chaîne cliquable (tronc commun puis voies) et fiche du transmetteur choisi.
export default function ChaineRapport({ hadithId }: { hadithId: string }) {
  const locale = useLocale();
  const t = useTranslations("rapport");
  const tRecherche = useTranslations("recherche");
  const hadith = hadithParId(hadithId);
  const { tronc = [], voies = [] } = hadith?.chaine ?? {};
  const [selection, setSelection] = useState(tronc[tronc.length - 1] ?? "");
  const [vue, setVue] = useState<"biographie" | "fiabilite">("biographie");
  if (!hadith) return null;

  // Chaque voie complète = tronc + transmetteurs propres ; sert aux maîtres et élèves « dans cette chaîne ».
  const chemins = voies.map((v) => [...tronc, ...v.transmetteurs]);
  const voisins = (id: string, decalage: -1 | 1) => [
    ...new Set(chemins.flatMap((c) => {
      const i = c.indexOf(id);
      const voisin = i === -1 ? undefined : c[i + decalage];
      return voisin ? [voisin] : [];
    })),
  ].filter((v) => transmetteurParId(v) !== undefined);
  const choisir = (id: string, vueChoisie: "biographie" | "fiabilite" = "biographie") => {
    setSelection(id);
    setVue(vueChoisie);
  };

  const ids = [...tronc, ...voies.flatMap((v) => v.transmetteurs)];
  // Un transmetteur non évalué interdit d'affirmer qu'aucun n'est faible.
  const aucunFaible = ids.every((id) => !["daif", "non-evalue"].includes(transmetteurParId(id)?.categorie ?? "non-evalue"));
  const choisi = transmetteurParId(selection);
  const presences = presenceDansHadith(hadith, selection);
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

  const noeud = (id: string, dernier: boolean) => {
    const tr = transmetteurParId(id);
    if (!tr) return null;
    return (
      <li key={id} className={styles.maillon}>
        <button
          type="button"
          className={`${styles.noeud} ${styles.porteur}`}
          data-categorie={tr.categorie}
          aria-pressed={selection === id}
          aria-controls="fiche-transmetteur"
          onClick={() => choisir(id)}
          aria-label={t("fiche.ouvrir", { nom: tr.nomTranslittere })}
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

  return (
    <div className={styles.disposition}>
      <section className={`${ui.carte} ${styles.arbre}`} aria-labelledby="titre-isnad">
        <div className={styles.entete}>
          <h2 id="titre-isnad">
            {t("isnad")}
          </h2>
          <p className={ui.discret}>{t("cliquer")}</p>
        </div>

        <p className={styles.guide}>{t("isnadGuide")}</p>
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
          <ol className={styles.suite}>{tronc.map((id, i) => noeud(id, i === tronc.length - 1))}</ol>
        </div>

        <div className={`${styles.groupe} ${styles.voies}`}>
          <h3 className={styles.sousTitre}>
            {t("voies")}{pivot && <> · <bdi lang="ar-Latn" dir="ltr">{pivot.nomTranslittere}</bdi></>}
          </h3>
          {voies.map((voie) => {
            const ouvrage = ouvrageParId(voie.ouvrage);
            return (
              <div key={voie.id} className={styles.groupe}>
                <p className={styles.libelleVoie}>
                  {t("voie", { reference: tRecherche("numero", { ouvrage: ouvrage?.nom ?? voie.ouvrage, numero: voie.numero }) })}
                </p>
                <ol className={styles.suite}>
                  {voie.transmetteurs.map((id, i) => noeud(id, i === voie.transmetteurs.length - 1))}
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
          className={`${ui.carte} ${styles.fiche} ${styles.porteur}`}
          data-categorie={choisi.categorie}
          aria-labelledby="titre-fiche"
          aria-live="polite"
        >
          <div className={styles.identite}>
            <p id="titre-fiche" className={ui.surtitre}>{t("fiche.titre")}</p>
            <p lang="ar" dir="rtl" className={`texte-arabe ${styles.ficheNomAr}`}>{choisi.nomAr}</p>
            <button type="button" className={styles.ficheNomLatin} onClick={() => setVue("biographie")}
              aria-label={t("fiche.ouvrirBiographie", { nom: choisi.nomTranslittere })}>
              <bdi lang="ar-Latn" dir="ltr">{choisi.nomTranslittere}</bdi> <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className={ui.badges}>
            <button type="button" className={`${ui.badge} ${styles.badgeCategorie} ${styles.porteur} ${styles.fiabiliteRaccourci}`}
              data-categorie={choisi.categorie} onClick={() => setVue("fiabilite")}
              aria-label={t("fiche.ouvrirFiabilite", { nom: choisi.nomTranslittere })}>
              {t(categories[choisi.categorie])} <span aria-hidden="true">↗</span>
            </button>
            {choisi.generation && <span className={ui.badge}>{t(generations[choisi.generation])}</span>}
            {choisi.deces && <span className={ui.badge}>{deces(choisi.deces)}</span>}
            {choisi.ville && (
              <span className={ui.badge}>
                <bdi lang="ar" dir="rtl" className="texte-arabe">{choisi.ville.ar}</bdi>{" "}
                <bdi lang="ar-Latn" dir="ltr">({choisi.ville.translitteration})</bdi>
              </span>
            )}
          </div>


          <div className={styles.ficheOnglets} role="group" aria-label={t("fiche.choisirVue")}>
            <button type="button" className={styles.ficheOnglet} aria-pressed={vue === "biographie"}
              onClick={() => setVue("biographie")}>{t("fiche.vueBiographie")}</button>
            <button type="button" className={styles.ficheOnglet} aria-pressed={vue === "fiabilite"}
              onClick={() => setVue("fiabilite")}>{t("fiche.vueFiabilite")}</button>
          </div>

          {vue === "biographie" ? (
            <div className={styles.ficheContenu} aria-live="polite">
              <section className={styles.groupe}>
                <h3 className={styles.titreBloc}>{t("fiche.biographie")}</h3>
                <p {...bloc(choisi.biographie)} />
              </section>
              <div className={styles.groupe}>
                <h3 className={styles.titreBloc}>{t("fiche.relations")}</h3>
                <dl className={styles.relations}>
                  {([[-1, "maitres"], [1, "eleves"]] as const).map(([decalage, cle]) => (
                    <div key={cle}>
                      <dt>{t("fiche." + cle)}</dt>
                      <dd className={styles.listeVoisins}>
                        {voisins(choisi.id, decalage).length === 0 ? t("fiche.aucun") :
                          voisins(choisi.id, decalage).map((id) => {
                            const tr = transmetteurParId(id);
                            return tr ? <button type="button" key={id} onClick={() => choisir(id)}
                              className={styles.lienVoisin}
                              aria-label={t("fiche.ouvrir", { nom: tr.nomTranslittere })}>
                                <bdi dir="auto">{tr.nomTranslittere}</bdi><span aria-hidden="true">↗</span>
                              </button> : null;
                          })}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <button type="button" className={styles.versFiabilite} onClick={() => setVue("fiabilite")}>
                {t("fiche.voirFiabilite")} <span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : (
            <div className={styles.ficheContenu} aria-live="polite">
              <section className={styles.contexteHadith} aria-labelledby="contexte-titre">
                <h3 id="contexte-titre" className={styles.titreBloc}>{t("fiche.pourHadith")}</h3>
                <p className={styles.contextNote}>{t("fiche.noteContextuelle")}</p>
                {presences.length === 0 ? (
                  <p className={styles.jugement}>{t("fiche.absentDeLaChaine")}</p>
                ) : (
                  <ul className={styles.listeVoies}>
                    {presences.map((p) => {
                      const ouvrage = ouvrageParId(p.ouvrageId);
                      return (
                        <li key={p.voieId}>
                          <strong>{tRecherche("numero", { ouvrage: ouvrage?.nom ?? p.ouvrageId, numero: p.numero })}</strong>
                          <span>{t("fiche.position", { position: p.position, total: p.total })}</span>
                          {p.partieCommune && <span className={styles.tagCommun}>{t("fiche.troncCommun")}</span>}
                          <div className={styles.voisinsContextuels}>
                            {p.precedentId && transmetteurParId(p.precedentId) && (
                              <button type="button" className={styles.lienVoisin} onClick={() => choisir(p.precedentId!)}>
                                {t("fiche.maillonPrecedent")} : {transmetteurParId(p.precedentId)?.nomTranslittere} ↗
                              </button>
                            )}
                            {p.suivantId && transmetteurParId(p.suivantId) && (
                              <button type="button" className={styles.lienVoisin} onClick={() => choisir(p.suivantId!)}>
                                {t("fiche.maillonSuivant")} : {transmetteurParId(p.suivantId)?.nomTranslittere} ↗
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
              <section className={styles.groupe}>
                <h3 className={styles.titreBloc}>{t("fiche.classementTransmetteur")}</h3>
                <p className={styles.classement}>
                  <span className={\`\${ui.badge} \${styles.badgeCategorie} \${styles.porteur}\`}
                    data-categorie={choisi.categorie}>{t(categories[choisi.categorie])}</span>
                </p>
                {choisi.categorie === "non-evalue" ? (
                  <p className={styles.jugement}>{t("fiche.nonEvalueExplication")}</p>
                ) : (
                  <p className={styles.contextNote}>{t("fiche.categorieNotice")}</p>
                )}
                {choisi.verdictAr && (
                  <div className={styles.verdict}>
                    <p className={styles.etiquette}>{t("fiche.verdict")}</p>
                    <p lang="ar" dir="rtl" className={\`texte-arabe \${styles.verdictAr}\`}>{choisi.verdictAr}</p>
                  </div>
                )}
              </section>
              <section className={styles.groupe}>
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
              </section>
              <section className={\`\${styles.groupe} \${styles.sources}\`}>
                <h3 className={styles.titreBloc}>{t("fiche.sources")}</h3>
                {choisi.sources.length === 0 ? (
                  <p className={styles.jugement}>{t("fiche.aucuneSource")}</p>
                ) : (
                  <ul>
                    {choisi.sources.map((s) => (
                      <li key={s.ouvrage}>
                        <bdi>{ouvrageParId(s.ouvrage)?.nom ?? s.ouvrage}</bdi>
                        {" · "}{s.reference ?? t("fiche.referenceACompleter")}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <p className={styles.distinction}>{t("fiche.distinctionHadith")}</p>
            </div>
          )}

          <p className={ui.avertissement}>{t("fiche.exemple")}</p>
        </aside>
      )}
    </div>
  );
}
