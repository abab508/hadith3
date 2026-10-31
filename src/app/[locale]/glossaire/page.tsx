import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { chaineDeRepli, entree } from "@/donnees/catalogue";
import { nomLangueTraduit } from "@/donnees/langues-affichage";
import type { Terme } from "@/donnees/schemas/terme";
import { termes } from "@/donnees/termes";
import { definitionGlossaire } from "@/donnees/definitions-glossaire";
import { routing } from "@/i18n/routing";
import styles from "@/app/[locale]/glossaire/Glossaire.module.css";

const clesDomaines = {
  authenticite: "domaines.authenticite",
  chaine: "domaines.chaine",
  transmetteurs: "domaines.transmetteurs",
  "texte-defauts": "domaines.texteDefauts",
  "critique-sources": "domaines.critiqueSources",
} as const;

function traductionPour(langues: Terme["langues"], locale: string) {
  const tag = [...chaineDeRepli(locale), "fr", "en"].find((candidat) => langues[candidat]);
  return { tag, traduction: tag ? langues[tag] : undefined };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "glossaire" });
  return { title: t("titre") };
}

export default async function Glossaire({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("glossaire");

  function repli(tag: string | undefined) {
    if (!tag || tag === locale) return null;
    const langue = entree(tag);
    const nom = langue ? nomLangueTraduit(langue, locale) : tag;
    return <p className={styles.repli}>{t("repli", { langue: nom })}</p>;
  }

  return (
    <main id="contenu" tabIndex={-1} className={styles.glossaire}>
      <h1>{t("titre")}</h1>
      <p>{t("introduction")}</p>
      {Object.entries(clesDomaines).map(([domaine, cle]) => (
        <section key={domaine} aria-labelledby={`domaine-${domaine}`} className={styles.domaine} data-domaine={domaine}>
          <h2 id={`domaine-${domaine}`}>{t(cle)}</h2>
          <div className={styles.fiches}>
            {termes.termes.filter((terme) => terme.domaine === domaine).map((terme) => {
              const { tag, traduction } = traductionPour(terme.langues, locale);
              const definition = definitionGlossaire(terme.id, locale);
              const langueExplication = definition?.langue ?? traduction?.langueExplication ?? tag;
              return (
                <article key={terme.id} id={terme.id} className={styles.fiche} data-terme={terme.id}>
                  <h3 lang={locale === "ar" ? "ar" : tag} dir={locale === "ar" ? "rtl" : entree(tag ?? locale)?.direction}>
                    {locale === "ar" ? terme.ar : traduction?.terme}
                  </h3>
                  <p className={styles.arabe} lang="ar" dir="rtl">{terme.ar}</p>
                  <p className={styles.translitteration} lang="ar-Latn" dir="ltr">{terme.translitteration}</p>
                  <p lang={langueExplication} dir={definition?.direction ?? entree(langueExplication ?? locale)?.direction}>{definition?.texte ?? traduction?.explication}</p>
                  {repli(tag)}
                </article>
              );
            })}
            {termes.notionsDocumentaires.filter((notion) => notion.domaine === domaine).map((notion) => {
              const { tag, traduction } = traductionPour(notion.langues, locale);
              const langueExplication = traduction?.langueExplication ?? tag;
              return (
                <article key={notion.id} id={notion.id} className={styles.fiche} data-notion={notion.id}>
                  <h3 lang={tag} dir={entree(tag ?? locale)?.direction}>{traduction?.terme}</h3>
                  <p lang={langueExplication} dir={entree(langueExplication ?? locale)?.direction}>{traduction?.explication}</p>
                  {repli(tag)}
                  {langueExplication !== tag && repli(langueExplication)}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
