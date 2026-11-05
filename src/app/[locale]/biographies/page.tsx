import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PROPHETES, SERIES, critiques, personnesDe, type Serie } from "@/donnees/biographies";
import styles from "./Biographies.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "biographies" });
  return { title: t("titre"), description: t("intro") };
}

// Nombre de fiches de chaque série (prophètes : nombre de prophètes de la liste).
function compte(s: Serie): number {
  if (s === "prophetes") return PROPHETES.length + 1; // avec le Prophète Muḥammad ﷺ
  if (s === "savants") return personnesDe("auteurs").length + critiques().length;
  return personnesDe(s).length;
}

export default async function PageBiographies({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("biographies");
  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <header className={styles.entete}>
        <p className={styles.surtitre}>{t("surtitre")}</p>
        <h1 className={styles.titre}>{t("titre")}</h1>
        <p className={styles.intro}>{t("intro")}</p>
      </header>
      <ul className={styles.series}>
        {SERIES.map((s) => (
          <li key={s} data-serie={s}>
            <Link href={`/biographies/${s}`} className={styles.carteSerie}>
              <svg className={styles.ornement} viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="9" y="9" width="22" height="22" rx="2" />
                <rect x="9" y="9" width="22" height="22" rx="2" transform="rotate(45 20 20)" />
                <circle cx="20" cy="20" r="3" />
              </svg>
              <h2 className={styles.nomSerie}>{t(`series.${s}.titre`)}</h2>
              <p className={styles.descSerie}>{t(`series.${s}.description`)}</p>
              <span className={styles.compte}>{t(s === "prophetes" ? "nbProphetes" : "compteur", { n: compte(s) })} →</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className={styles.mention}>{t("avertissement")}</p>
      <p className={styles.mention}>{t("source")}</p>
    </main>
  );
}
