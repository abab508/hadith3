import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Carrousel from "@/composants/Carrousel";
import ImageDecorative from "@/composants/ImageDecorative";
import { chapitresDuTheme, imageTheme, themeParId, themes } from "@/donnees/themes";
import { clesChapitres, clesThemes } from "@/donnees/cles-themes";
import { routing } from "@/i18n/routing";
import styles from "@/composants/Pages.module.css";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => themes.map((t) => ({ locale, id: t.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const theme = themeParId(id);
  if (!theme) return {};
  const t = await getTranslations({ locale, namespace: "themes" });
  return { title: t(clesThemes[theme.cle].titre), description: t(clesThemes[theme.cle].description) };
}

export default async function PageTheme({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const theme = themeParId(id);
  if (!theme) notFound();
  const t = await getTranslations("themes");
  const tc = await getTranslations("chapitres");
  const liste = chapitresDuTheme(theme.id);

  return (
    <main id="contenu" tabIndex={-1} className={styles.pageTheme}>
      <section className={styles.banniere} aria-labelledby="titre-theme">
        <ImageDecorative className={styles.imageBanniere} src={imageTheme(theme.id)} sizes="100vw" preload />
        <span className={styles.meteores} aria-hidden="true"><span /><span /><span /></span>
        <div className={styles.texteBanniere}>
          <Link href="/themes" className={styles.retour}><span aria-hidden="true" className={styles.flecheRetour}>←</span> {t("retourThemes")}</Link>
          <h1 id="titre-theme" className={styles.titreTheme}>{t(clesThemes[theme.cle].titre)}</h1>
          <p className={styles.descBanniere}>{t(clesThemes[theme.cle].description)}</p>
        </div>
      </section>

      {liste.length > 0 ? (
        <Carrousel precedent={t("precedent")} suivant={t("suivant")}>
          {liste.map((c, i) => {
            const cles = clesChapitres[c.cle];
            return (
              <li key={c.id} className={styles.carteChapitre} style={{ ["--i" as string]: i }}>
                <Link href={`/chapitres/${c.id}`}>
                  <span className={styles.cadreImageChapitre}>
                    <ImageDecorative src={`/images/hd/${c.image}.png`} sizes="(max-width: 1155px) 13rem, (max-width: 1378px) 18vw, 15.5rem" />
                  </span>
                  <span className={styles.corpsCarte}>
                    <span className={styles.titreCarte}>{i + 1}. {tc(cles.titre)}</span>
                    {cles.sousTitre && <span className={styles.sousTitreCarte} dir="auto">({tc(cles.sousTitre)})</span>}
                    <span className={styles.mention}>{t("aFournir")}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </Carrousel>
      ) : (
        <p className={styles.vide}>{t("chapitresAFournir")}</p>
      )}
    </main>
  );
}
