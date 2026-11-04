import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SelecteurLangue from "@/composants/SelecteurLangue";
import ThemeSwitch from "@/composants/ThemeSwitch";
import AmbianceSonore from "@/composants/AmbianceSonore";
import Embleme from "@/composants/Embleme";
import styles from "@/composants/EnTete.module.css";

// Bannière du site (charte « nuit et or ») : marque, navigation unique (liens + langues), actions.
export default async function EnTete() {
  const t = await getTranslations("entete");
  const accueil = await getTranslations("accueil");
  const navigation = await getTranslations("navigation");
  return (
    <header className={styles.entete}>
      <div className={styles.barre}>
        <Link href="/" className={styles.lienMarque} aria-label={t("accueil")}>
          <svg className={styles.logo} width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M8 40V22C8 13 15 6 24 4c9 2 16 9 16 18v18" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13 40V24c0-6 5-11 11-13 6 2 11 7 11 13v16" fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".7" />
            <path d="M24 36c-4-2.5-8-3-12-2.5V27c4-.5 8 0 12 2.5 4-2.5 8-3 12-2.5v6.5c-4-.5-8 0-12 2.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M24 29.5V36" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5 40h38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className={styles.textes}>
            <Embleme nomLatin={accueil("titre")} nomArabe={t("nomArabe")} taille="petit" />
            <span className={styles.slogan}>{t("slogan")}</span>
          </span>
        </Link>
        <Suspense fallback={null}>
          <SelecteurLangue />
        </Suspense>
        <div className={styles.actions}>
          <Link href="/recherche" className={styles.icone} aria-label={t("rechercher")} title={t("rechercher")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </Link>
          <AmbianceSonore />
          <ThemeSwitch />
          <Link href="/parametres" className={styles.icone} aria-label={navigation("parametres")} title={navigation("parametres")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
