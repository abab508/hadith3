import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Onglets from "@/composants/Onglets";
import { chapitreParId, chapitres, chapitresDuTheme, themeParId } from "@/donnees/themes";
import { clesChapitres, clesThemes } from "@/donnees/cles-themes";
import { routing } from "@/i18n/routing";
import styles from "@/composants/Pages.module.css";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => chapitres.map((c) => ({ locale, id: c.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const chapitre = chapitreParId(id);
  if (!chapitre) return {};
  const t = await getTranslations({ locale, namespace: "chapitres" });
  return { title: t(clesChapitres[chapitre.cle].titre) };
}

export default async function PageChapitre({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const chapitre = chapitreParId(id);
  const theme = chapitre ? themeParId(chapitre.theme) : undefined;
  if (!chapitre || !theme) notFound();
  const t = await getTranslations("chapitre");
  const tc = await getTranslations("chapitres");
  const tt = await getTranslations("themes");
  const nav = await getTranslations("navigation");
  const cles = clesChapitres[chapitre.cle];
  const numero = chapitresDuTheme(theme.id).findIndex((c) => c.id === chapitre.id) + 1;
  const titreTheme = tt(clesThemes[theme.cle].titre);
  const aFournir = <p className={styles.mentionListe}>{tt("aFournir")}</p>;

  return (
    <main id="contenu" tabIndex={-1} className={styles.pageChapitre}>
      <img className={styles.fondChapitre} src="/images/maquette/chapitre-fond.jpg" alt="" />
      <div className={styles.grilleChapitre}>
        <div className={styles.colonnePrincipale}>
          <ol className={styles.filAriane} aria-label={t("fil")}>
            <li><Link href="/">{nav("accueil")}</Link></li>
            <li><Link href={`/themes/${theme.id}`}>{titreTheme}</Link></li>
            <li aria-current="page">{numero}. {tc(cles.titre)}</li>
          </ol>
          <p className={styles.surtitreChapitre}>{tt("chapitre", { n: numero })}</p>
          <h1 className={styles.titreChapitre}>{tc(cles.titre)}</h1>
          {cles.sousTitre && <p className={styles.sousTitreChapitre} dir="auto">({tc(cles.sousTitre)})</p>}
          <Onglets
            titre={t("onglets")}
            onglets={[
              {
                cle: "introduction",
                libelle: t("introduction"),
                contenu: (
                  <section className={styles.introChapitre} aria-labelledby="titre-intro">
                    <span className={styles.medaillon} aria-hidden="true">۞</span>
                    <div>
                      <h2 id="titre-intro">{t("introduction")}</h2>
                      {cles.intro ? (
                        <>
                          <p>{tc(cles.intro)}</p>
                          <p className={styles.mention}>{tt("aValider")}</p>
                        </>
                      ) : aFournir}
                    </div>
                  </section>
                ),
              },
              { cle: "hadiths", libelle: t("hadiths"), contenu: <p className={styles.mentionListe}>{t("hadithsAFournir")}</p> },
              { cle: "explications", libelle: t("explications"), contenu: aFournir },
              { cle: "references", libelle: t("references"), contenu: aFournir },
              { cle: "audio", libelle: t("audio"), contenu: aFournir },
            ]}
          />
        </div>
        <aside className={styles.panneauHadiths} aria-labelledby="titre-hadiths">
          <h2 id="titre-hadiths">{t("hadithsDuChapitre")}</h2>
          <ol className={styles.hadithsVides}>
            {[1, 2, 3].map((n) => (
              <li key={n}><span className={styles.numeroHadith}>{n}.</span><span className={styles.ligneVide} /></li>
            ))}
          </ol>
          <p className={styles.mention}>{t("hadithsAFournir")}</p>
        </aside>
      </div>
    </main>
  );
}
