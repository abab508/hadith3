import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import IconeTheme from "@/composants/IconeTheme";
import ImageDecorative from "@/composants/ImageDecorative";
import { imageTheme, themes } from "@/donnees/themes";
import CartesIllustrees from "@/composants/CartesIllustrees";
import { clesThemes } from "@/donnees/cles-themes";
import styles from "@/composants/Pages.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "themes" });
  return { title: t("titre"), description: t("sousTitre") };
}

export default async function PageThemes({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("themes");

  return (
    <main id="contenu" tabIndex={-1} className={styles.pageThemes}>
      <div className={styles.enteteThemes}>
        <Link href="/" className={styles.retour}><span aria-hidden="true" className={styles.flecheRetour}>←</span> {t("retour")}</Link>
        <h1 className={styles.titreCentre}>{t("titre")}</h1>
        <p className={styles.sousTitreCentre}>{t("sousTitre")}</p>
      </div>
      {/* Carte restaurée de la maquette ; les étiquettes restent de vrais textes accessibles. */}
      <div className={styles.carte} dir="ltr">
        <div className={styles.cadreCarte}>
          <ImageDecorative className={styles.imageCarte} src="/images/hd/themes.png" sizes="(max-width: 1440px) 100vw, 90rem" preload />
        </div>
        <span className={styles.brumeCarte} aria-hidden="true" />
        <ul className={styles.etiquettes}>
          {themes.map((theme, i) => (
            <li key={theme.id} style={{ ["--x" as string]: theme.carte.x, ["--y" as string]: theme.carte.y, ["--i" as string]: i }}>
              <Link href={`/themes/${theme.id}`} className={styles.etiquette}>
                <span className={styles.pastille}><IconeTheme icone={theme.icone} /></span>
                <span className={styles.texteEtiquette} dir="auto">
                  <span className={styles.nomTheme}>{t(clesThemes[theme.cle].titre)}</span>
                  <span className={styles.descTheme}>{t(clesThemes[theme.cle].description)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <section className={styles.galerieIllustree} aria-label={t("titre")}>
        <CartesIllustrees libelle={t("titre")} cartes={themes.map((theme) => ({
          id: theme.id, href: `/themes/${theme.id}`, image: imageTheme(theme.id),
          titre: t(clesThemes[theme.cle].titre), description: t(clesThemes[theme.cle].description),
        }))} />
      </section>
    </main>
  );
}
