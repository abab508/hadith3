import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { corpus, ouvrageParId, hadithParId, bibliothequeParId, texteDans } from "@/donnees/corpus";
import { entree } from "@/donnees/catalogue";
import { clesMention, provenance } from "@/donnees/provenance";
import type { Bibliotheque } from "@/donnees/schemas/corpus";
import Terme from "@/composants/Terme";
import ChaineRapport from "@/composants/ChaineRapport";
import Embleme from "@/composants/Embleme";
import TexteMixte from "@/composants/TexteMixte";
import IconeTheme from "@/composants/IconeTheme";
import { Link } from "@/i18n/navigation";
import ui from "@/composants/Interface.module.css";
import styles from "./Rapport.module.css";

const acces = {
  "licence-ouverte": "acces.licence-ouverte",
  "api-accord": "acces.api-accord",
  "a-valider": "acces.a-valider",
  "a-verifier": "acces.a-verifier",
} as const satisfies Record<Bibliotheque["acces"], string>;

export function generateStaticParams() {
  return corpus.hadiths.map((h) => ({ id: h.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "rapport" });
  const tRecherche = await getTranslations({ locale, namespace: "recherche" });
  // Titre lisible (« Ṣaḥīḥ al-Bukhārī, n° 1 ») plutôt que l'identifiant technique.
  const principale = hadithParId(id)?.occurrences[0];
  const hadith = principale
    ? tRecherche("numero", { ouvrage: ouvrageParId(principale.ouvrage)?.nom ?? principale.ouvrage, numero: principale.numero })
    : id;
  return { title: t("titre", { hadith }) };
}

export default async function Rapport({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rapport");
  const tRecherche = await getTranslations("recherche");
  const tAccueil = await getTranslations("accueil");
  const tEntete = await getTranslations("entete");

  const hadith = hadithParId(id);
  if (!hadith) {
    return (
      <main id="contenu" tabIndex={-1} className={ui.page}>
        <h1>{t("titreNotFound")}</h1>
        <p>{t("hadithNotFound")}</p>
      </main>
    );
  }

  // Un bloc rédigé : sa propre langue et sa direction, même quand il vient d'une langue de repli.
  const bloc = (texte: Record<string, string>) => {
    const { tag, texte: contenu } = texteDans(texte, locale);
    // Les adresses web éventuelles restent isolées en LTR, même dans un bloc arabe.
    return { lang: tag, dir: entree(tag)?.direction, children: <TexteMixte texte={contenu} /> };
  };

  const { statut, traduction } = provenance(hadith, locale);
  const principale = hadith.occurrences.find((o) => o.correspondance === "original") ?? hadith.occurrences[0]!;
  const reference = tRecherche("numero", {
    ouvrage: ouvrageParId(principale.ouvrage)?.nom ?? principale.ouvrage,
    numero: principale.numero,
  });

  return (
    <main id="contenu" tabIndex={-1} className={`${ui.page} ${styles.pageRapport}`}>
      <section className={styles.banniere} aria-label={t("banniere.titre")}>
        <img className={styles.imageBanniere} src="/images/maquette/accueil.jpg" alt="" />
        <span className={styles.voileBanniere} aria-hidden="true" />
        <Embleme nomLatin={tAccueil("titre")} nomArabe={tEntete("nomArabe")} mention={t("banniere.surtitre")} />
        <p className={styles.grandTitre}>{t("banniere.titre")}</p>
        <p className={styles.texteBanniere}>{t("banniere.texte")}</p>
        <p className={styles.ligneAnalyse}>
          <span className={styles.filet} aria-hidden="true" />
          <a href="#titre-isnad" className={styles.pastilleAnalyse}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
            {t("banniere.analyse")}
          </a>
          <span className={styles.filet} aria-hidden="true" />
        </p>
      </section>
      <p>
        <Link href={{ pathname: "/chaine", query: { hadith: hadith.id } }}>{t("autreHadith")}</Link>
      </p>

      <div className={styles.titres}>
        <p className={ui.surtitre}>{t("surtitre")}</p>
        {traduction && locale !== "ar" ? (
          <h1 lang={traduction.langue} className={styles.titre}>{traduction.texte}</h1>
        ) : (
          <h1 lang="ar" dir="rtl" className={`texte-arabe ${styles.titre}`}>{hadith.requeteAr}</h1>
        )}
      </div>

      <section className={ui.carte} aria-labelledby="titre-original">
        <div className={styles.ligne}>
          <h2 id="titre-original" className={ui.badge} data-ton="accent">
            {t("texteOriginal", { reference })}
          </h2>
          <p className={ui.discret}>{t("nonRemplace")}</p>
        </div>
        <p lang="ar" dir="rtl" className={`texte-arabe ${styles.original}`}>{hadith.texteAr}</p>
        {locale !== "ar" && (
          traduction ? (
            <div className={ui.traduction} data-origine={traduction.origine}>
              <p lang={traduction.langue}>{traduction.texte}</p>
              <p className={ui.mention}>{tRecherche(clesMention[statut], { source: traduction.source ?? "" })}</p>
            </div>
          ) : (
            <p className={`${ui.traduction} ${ui.discret}`} data-origine={statut}>{tRecherche(clesMention[statut])}</p>
          )
        )}
      </section>

      <div className={styles.duo}>
        <section className={`${ui.carte} ${styles.statut}`} aria-labelledby="titre-statut">
          <h2 id="titre-statut" className={styles.etiquette}>{t("statut")}</h2>
          <p className={styles.verdict}><Terme id={hadith.statutTerme} /></p>
          <p {...bloc(hadith.statut)} />
          <p className={styles.note}>{t("avertissement")}</p>
        </section>
        <section className={ui.carte} aria-labelledby="titre-particularite">
          <h2 id="titre-particularite" className={styles.sousTitre}>{t("particularite")}</h2>
          <p {...bloc(hadith.particularite)} />
          <p><Link href="/glossaire">{tAccueil("glossaire")}</Link></p>
        </section>
      </div>

      <ChaineRapport hadithId={hadith.id} />

      <section className={ui.carte} aria-labelledby="titre-sources">
        <h2 id="titre-sources" className={styles.sousTitre}>{t("sources")}</h2>
        <div className={styles.tableau} tabIndex={0} role="region" aria-labelledby="titre-sources">
          <table>
            <thead>
              <tr>
                <th scope="col">{t("ouvrage")}</th>
                <th scope="col">{t("reference")}</th>
                <th scope="col">{t("bibliotheque")}</th>
                <th scope="col">{t("colonneAcces")}</th>
              </tr>
            </thead>
            <tbody>
              {hadith.occurrences.map((occurrence) => {
                const ouvrage = ouvrageParId(occurrence.ouvrage);
                const bibliotheque = bibliothequeParId(occurrence.bibliotheque);
                return (
                  <tr key={occurrence.id}>
                    <td>
                      <bdi lang="ar-Latn">{ouvrage?.nom}</bdi>{" "}
                      <bdi lang="ar" dir="rtl" className={`texte-arabe ${ui.discret}`}>{ouvrage?.nomAr}</bdi>
                    </td>
                    <td>{occurrence.numero}</td>
                    <td><bdi>{bibliotheque?.nom}</bdi></td>
                    <td>{bibliotheque ? t(acces[bibliotheque.acces]) : t("fiche.aucun")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className={ui.actions}>
        <button type="button" className={ui.boutonSecondaire} disabled aria-describedby="bientot">
          {t("actions.validation")}
        </button>
        <span id="bientot" className={ui.discret}>{t("actions.bientot")}</span>
      </div>

      <p className={styles.barreThematique}>
        <IconeTheme icone="livre" className={styles.pictoBarre} />
        <span><strong>{t("navigationThematique.titre")}</strong> : {t("navigationThematique.texte")}</span>
        <Link href="/themes" aria-label={t("navigationThematique.titre")}>↗</Link>
      </p>

      <p className={ui.avertissement}>{t("avertissementData")}</p>
    </main>
  );
}
