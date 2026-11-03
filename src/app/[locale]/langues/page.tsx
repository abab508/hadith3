import BannierePrestige from "@/composants/BannierePrestige";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { catalogue } from "@/donnees/catalogue";
import { calculerCompletude } from "@/donnees/completude";
import { languesDuSelecteur, nomLangueTraduit } from "@/donnees/langues-affichage";
import { messagesDe } from "@/i18n/charger";
import { routing } from "@/i18n/routing";
import styles from "@/app/[locale]/langues/Langues.module.css";

const clesNiveaux = {
  identifiee: "niveaux.identifiee",
  affichable: "niveaux.affichable",
  interface: "niveaux.interface",
  recherche: "niveaux.recherche",
  traductionAuto: "niveaux.traductionAuto",
  contenuDocumentaire: "niveaux.contenuDocumentaire",
  contenuVerifie: "niveaux.contenuVerifie",
  validationHumaine: "niveaux.validationHumaine",
} as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "langues" });
  return { title: t("titre") };
}

export default async function Langues({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, reference] = await Promise.all([
    getTranslations("langues"),
    getFormatter(),
    messagesDe(catalogue.langueParDefaut),
  ]);
  const langues = await Promise.all(languesDuSelecteur().map(async (langue) => ({
    langue,
    completude: calculerCompletude(reference ?? {}, await messagesDe(langue.tag)),
  })));

  return (
    <main id="contenu" tabIndex={-1} className={`${styles.page} prestige-page`}>
      <BannierePrestige locale={locale} />
      <h1>{t("titre")}</h1>
      <p>{t("introduction")}</p>
      <p className={styles.avertissement}>{t("avertissement")}</p>
      <div className={styles.langues}>
        {langues.map(({ langue, completude }) => (
          <article key={langue.tag} className={styles.langue} data-langue={langue.tag} aria-labelledby={`langue-${langue.tag}`}>
            <h2 id={`langue-${langue.tag}`} className={styles.nom}>
              <bdi
                lang={langue.tag}
                dir={langue.direction}
                style={{ fontFamily: [langue.police.famille, ...(langue.police.secours ?? [])].map((police) => `"${police}"`).join(", ") }}
              >
                {langue.nomNatif}
              </bdi>
              <bdi>{nomLangueTraduit(langue, locale)}</bdi>
              <bdi dir="ltr" className={styles.code}>{langue.tag}</bdi>
            </h2>
            {langue.statut === "experimentale" && <p className={styles.badge}>{t("experimentale")}</p>}
            <p className={styles.completude}>
              {t("completude", {
                presentes: format.number(completude.presentes),
                total: format.number(completude.total),
                pourcentage: format.number(completude.proportion, { style: "percent", maximumFractionDigits: 0 }),
              })}
            </p>
            <h3>{t("disponibilites")}</h3>
            <dl className={styles.niveaux} data-disponibilites>
              <div>
                <dt>{t("niveaux.interface")}</dt>
                <dd>{t(langue.niveaux.interface ? "oui" : "non")}</dd>
              </div>
              <div>
                <dt>{t("documentationPartielle")}</dt>
                <dd>{t(langue.niveaux.contenuDocumentaire ? "oui" : "non")}</dd>
              </div>
              <div>
                <dt>{t("documentationSpecialisee")}</dt>
                <dd>{t(langue.niveaux.contenuVerifie ? "oui" : "non")}</dd>
              </div>
            </dl>
            <details className={styles.details}>
              <summary>{t("detailNiveaux")}</summary>
              <dl className={styles.niveaux}>
                {(Object.keys(clesNiveaux) as Array<keyof typeof clesNiveaux>).map((niveau) => (
                  <div key={niveau} data-niveau={niveau}>
                    <dt>{t(clesNiveaux[niveau])}</dt>
                    <dd>{t(langue.niveaux[niveau] ? "oui" : "non")}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </article>
        ))}
      </div>
    </main>
  );
}
