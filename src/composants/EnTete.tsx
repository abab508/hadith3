import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SelecteurLangue from "@/composants/SelecteurLangue";
import ThemeSwitch from "@/composants/ThemeSwitch";
import styles from "@/composants/EnTete.module.css";

// Bannière du site : marque, puis le sélecteur de langue et les liens (une seule navigation).
export default async function EnTete() {
  const t = await getTranslations("entete");
  const accueil = await getTranslations("accueil");
  const locale = await getLocale();
  return (
    <header className={styles.entete}>
      <div className={styles.marque}>
        <Link href="/" className={styles.lienMarque} aria-label={t("accueil")}>
          <svg className={styles.logo} width="36" height="36" viewBox="0 0 40 40" aria-hidden="true">
            <rect x="9" y="9" width="22" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <rect x="9" y="9" width="22" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(45 20 20)" />
            <circle cx="20" cy="20" r="3.5" fill="var(--ocre)" />
          </svg>
          <span className={styles.marqueTexte}>
            <span className={styles.nom}>{accueil("titre")}</span>
            <span className={styles.marqueSousTitre}>
              {locale !== "ar" && <bdi className={styles.marqueArabe} lang="ar" dir="rtl">الملة الغائبة</bdi>}
              <bdi className={styles.marqueLatin} lang="ar-Latn" dir="ltr">Al-milla al-gha'iba</bdi>
            </span>
          </span>
        </Link>
        <span className={styles.slogan}>{t("slogan")}</span>
        <ThemeSwitch />
      </div>
      <Suspense fallback={null}>
        <SelecteurLangue />
      </Suspense>
    </header>
  );
}
