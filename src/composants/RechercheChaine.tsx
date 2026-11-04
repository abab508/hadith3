"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { entree } from "@/donnees/catalogue";
import { corpus, hadithParId, ouvrageParId, texteDans, transmetteurParId } from "@/donnees/corpus";
import type { Bibliotheque, CategorieTransmetteur } from "@/donnees/schemas/corpus";
import { Link } from "@/i18n/navigation";
import styles from "@/composants/RechercheChaine.module.css";

const acces = {
  "licence-ouverte": "acces.licenceOuverte",
  "api-accord": "acces.apiAccord",
  "a-valider": "acces.aValider",
  "a-verifier": "acces.aVerifier",
} as const satisfies Record<Bibliotheque["acces"], string>;

const legendes = {
  source: "legende.source",
  compagnon: "legende.compagnon",
  thiqa: "legende.thiqa",
  saduq: "legende.saduq",
  daif: "legende.daif",
  compilateur: "legende.compilateur",
  "non-evalue": "legende.nonEvalue",
} as const satisfies Record<CategorieTransmetteur, string>;

const tousLesOuvrages = corpus.bibliotheques.flatMap((b) => b.ouvrages.map((o) => o.id));

// Recherche par chaîne, version épurée : un cadre « Votre recherche » à gauche,
// l'aperçu de la chaîne à droite, et les bibliothèques repliées dans « Options avancées ».
export default function RechercheChaine({ hadithInitial, requete = "", trouves = null }: { hadithInitial: string; requete?: string; trouves?: string[] | null }) {
  const locale = useLocale();
  const t = useTranslations("chaine");
  const tRecherche = useTranslations("recherche");
  const tRapport = useTranslations("rapport");
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

  const hadith = hadithParId(hadithId);
  const tronc = hadith?.chaine.tronc ?? [];
  const voies = hadith?.chaine.voies ?? [];
  const actives = corpus.bibliotheques.filter((b) => bibliotheques.has(b.id));
  const choisis = actives.flatMap((b) => b.ouvrages.filter((o) => ouvrages.has(o.id)));
  const reference = (id: string) => {
    const h = hadithParId(id);
    const occ = h?.occurrences.find((o) => o.correspondance === "original") ?? h?.occurrences[0];
    return occ ? tRecherche("numero", { ouvrage: ouvrageParId(occ.ouvrage)?.nom ?? occ.ouvrage, numero: occ.numero }) : id;
  };

  const pastilles = (liste: { id: string; nom: string; nomAr: string }[]) => (
    <ul className={styles.pastilles}>
      {liste.map((o) => (
        <li key={o.id}>
          <button type="button" className={styles.pastille} aria-pressed={ouvrages.has(o.id)} onClick={() => setOuvrages(basculer(ouvrages, o.id))}>
            <bdi lang="ar-Latn">{o.nom}</bdi> <bdi lang="ar" dir="rtl" className="texte-arabe">{o.nomAr}</bdi>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.disposition}>
      <section className={styles.cadre} aria-labelledby="titre-votre-recherche">
        <h2 id="titre-votre-recherche" className={styles.titreCadre}>{t("votreRecherche")}</h2>

        <form role="search" action={`/${locale}/chaine`} method="get" className={styles.champ}>
          <label htmlFor="chercher-hadith">{t("chercherHadith")}</label>
          <div className={styles.barre}>
            <input id="chercher-hadith" name="q" type="search" dir="auto" defaultValue={requete} placeholder={t("exempleHadith")} />
            <button type="submit" className={styles.boutonChercher}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
              {t("chercherBouton")}
            </button>
          </div>
          {trouves && (
            <div className={styles.trouves} aria-live="polite">
              <p className={styles.aide}>{t("resultatsHadith", { count: trouves.length })}</p>
              {trouves.length > 0 && (
                <ul>
                  {trouves.map((id) => (
                    <li key={id}>
                      <button type="button" className={styles.trouve} aria-pressed={hadithId === id} onClick={() => setHadithId(id)}>
                        <span className={styles.referenceTrouve}>{reference(id)}</span>
                        <span lang="ar" dir="rtl" className={`texte-arabe ${styles.extrait}`}>{hadithParId(id)?.requeteAr}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>

        <div className={styles.champ}>
          <label htmlFor="choix-hadith">{t("hadith")}</label>
          <select id="choix-hadith" value={hadithId} onChange={(e) => setHadithId(e.currentTarget.value)}>
            {corpus.hadiths.map((h) => (
              <option key={h.id} value={h.id}>{reference(h.id)} — {h.requeteAr}</option>
            ))}
          </select>
        </div>

        <div className={styles.champ}>
          <label htmlFor="ajout-transmetteur">{t("ajouter")}</label>
          <input id="ajout-transmetteur" type="text" dir="auto" list="liste-transmetteurs" autoComplete="off" value={saisie}
            onChange={(e) => saisir(e.currentTarget.value)} />
          <datalist id="liste-transmetteurs">
            {corpus.transmetteurs.filter((x) => !chaine.includes(x.id)).map((x) => (
              <option key={x.id} value={x.nomTranslittere}>{x.nomAr}</option>
            ))}
          </datalist>
          <p className={styles.aide}>{t("etape2Aide")}</p>
          {chaine.length > 0 && (
            <ol className={styles.puces}>
              {chaine.map((id) => {
                const tr = transmetteurParId(id);
                if (!tr) return null;
                return (
                  <li key={id}>
                    <bdi lang="ar-Latn" dir="ltr">{tr.nomTranslittere}</bdi>
                    <button type="button" className={styles.retirer} aria-label={t("retirer", { nom: tr.nomTranslittere })}
                      onClick={() => setChaine(chaine.filter((x) => x !== id))}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <label className={styles.case}>
          <input type="checkbox" checked={faibles} onChange={(e) => setFaibles(e.currentTarget.checked)} />
          {t("faibles")}
        </label>

        <div className={styles.envoi}>
          <Link href={`/rapport/${hadithId}`} className={styles.generer} aria-describedby="resume-chaine">
            {t("generer")} <span aria-hidden="true" className={styles.fleche}>→</span>
          </Link>
          <p id="resume-chaine" className={styles.resume} aria-live="polite">
            {t("resumeOuvrages", { count: choisis.length })} · {t("resumeBibliotheques", { count: actives.length })}
          </p>
        </div>
        <p className={styles.lienTexte}><Link href="/recherche">{t("chercherTexte")} ↗</Link></p>
      </section>

      <section className={styles.apercu} aria-labelledby="titre-apercu-chaine">
        <h2 id="titre-apercu-chaine" className={styles.titreCadre}>{t("apercu")}</h2>
        <p className={styles.aide}>{t("apercuAide")}</p>
        <ol className={styles.ligne}>
          {tronc.map((id, i) => {
            const tr = transmetteurParId(id);
            if (!tr) return null;
            const indique = chaine.includes(id);
            return (
              <li key={id} className={styles.etapeLigne} data-categorie={tr.categorie} data-indique={indique || undefined} style={{ ["--i" as string]: i }}>
                <span className={styles.point} aria-hidden="true" />
                <span className={styles.nomsLigne}>
                  <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomAr}`}>{tr.nomAr}</bdi>
                  <bdi lang="ar-Latn" dir="ltr" className={styles.nomLatin}>{tr.nomTranslittere}</bdi>
                </span>
                <span className={styles.statut}>{indique ? t("indique") : tRapport(legendes[tr.categorie])}</span>
              </li>
            );
          })}
        </ol>
        <p className={styles.suite}>{t("voiesSuite", { count: voies.length })}</p>
      </section>

      <details className={styles.options}>
        <summary>{t("options")} <span aria-hidden="true" className={styles.chevron}>⌄</span></summary>
        <div className={styles.corpsOptions}>
          <div className={styles.bibliotheques}>
            {corpus.bibliotheques.map((b) => {
              const { tag, texte } = texteDans(b.description, locale);
              return (
                <label key={b.id} className={styles.bibliotheque}>
                  <input type="checkbox" checked={bibliotheques.has(b.id)} onChange={() => setBibliotheques(basculer(bibliotheques, b.id))} />
                  <span className={styles.descriptif}>
                    <span className={styles.nomBibliotheque}>
                      <bdi>{b.nom}</bdi>
                      {b.nomAr !== b.nom && <> <bdi lang="ar" dir="rtl" className="texte-arabe">{b.nomAr}</bdi></>}
                    </span>
                    <span lang={tag} dir={entree(tag)?.direction} className={styles.texteBibliotheque}>{texte}</span>
                    <span className={styles.badge}>{t(acces[b.acces])}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {actives.filter((b) => b.ouvrages.length > 0).map((b) => (
            <div key={b.id} className={styles.groupe}>
              <h3>{t("ouvragesHadith", { bibliotheque: b.nom })}</h3>
              {pastilles(b.ouvrages.filter((o) => o.categorie === "hadith"))}
              <p className={styles.aide}>{t("tousLesAutres")}</p>
              <h3>{t("ouvragesRijal")}</h3>
              {pastilles(b.ouvrages.filter((o) => o.categorie === "rijal"))}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
