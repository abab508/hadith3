import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Bibliotheque from "@/composants/Bibliotheque";
import { catalogueRecueils, rayons } from "@/donnees/recueils";
import styles from "@/composants/Bibliotheque.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bibliotheque" });
  return { title: t("titre"), description: t("sousTitre", { total: catalogueRecueils.recueils.length }) };
}

export default async function PageBibliotheque({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const { locale } = await params;
  const { q } = await searchParams;
  const requeteInitiale = typeof q === "string" ? q.slice(0, 120) : "";
  setRequestLocale(locale);
  const t = await getTranslations("bibliotheque");
  const titreArabe = locale === "ar" ? null : (await getTranslations({ locale: "ar", namespace: "bibliotheque" }))("titre");
  const total = catalogueRecueils.recueils.length;

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <section className={styles.hero} aria-labelledby="titre-bibliotheque">
        {/* Décor animé : ciel étoilé, croissant, lanternes, poussière de lumière. */}
        <div className={styles.ciel} aria-hidden="true">
          <span className={styles.croissant} />
          <svg className={`${styles.lanterne} ${styles.lanterneA}`} viewBox="0 0 40 90" width="40" height="90">
            <line x1="20" y1="0" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 22h16l-3 6H15z" fill="currentColor" />
            <path d="M13 28h14l4 24-4 16H13l-4-16z" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <ellipse className={styles.flamme} cx="20" cy="50" rx="6" ry="9" />
            <path d="M14 68h12l-6 10z" fill="currentColor" />
          </svg>
          <svg className={`${styles.lanterne} ${styles.lanterneB}`} viewBox="0 0 40 90" width="30" height="68">
            <line x1="20" y1="0" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 22h16l-3 6H15z" fill="currentColor" />
            <path d="M13 28h14l4 24-4 16H13l-4-16z" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <ellipse className={styles.flamme} cx="20" cy="50" rx="6" ry="9" />
            <path d="M14 68h12l-6 10z" fill="currentColor" />
          </svg>
          <svg className={styles.silhouette} viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice">
            <path d="M0 160V128h60v-18h40v18h30V96h8V60l4-10 4 10v36h8v32h40v-26a46 46 0 0 1 92 0v26h30V70h6V36l4-12 4 12v34h6v58h50v-40a70 70 0 0 1 140 0v40h50V70h6V36l4-12 4 12v34h6v58h30v-26a46 46 0 0 1 92 0v26h40V96h8V60l4-10 4 10v36h8v32h30v-18h40v18h40v-14a30 30 0 0 1 60 0v14h80v32z" />
            <rect className={styles.fenetre} x="582" y="108" width="8" height="14" rx="4" />
            <rect className={styles.fenetre} x="610" y="108" width="8" height="14" rx="4" />
            <rect className={styles.fenetre} x="380" y="114" width="6" height="10" rx="3" />
            <rect className={styles.fenetre} x="810" y="114" width="6" height="10" rx="3" />
          </svg>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className={styles.poussiere} style={{ ["--i" as string]: i }} />
          ))}
        </div>
        {titreArabe && <p className={`${styles.surtitre} texte-arabe`} lang="ar" dir="rtl">{titreArabe}</p>}
        <h1 id="titre-bibliotheque" className={styles.titre}>{t("titre")}</h1>
        <p className={styles.sousTitre}>{t("sousTitre", { total })}</p>
      </section>

      <Bibliotheque rayons={rayons()} requeteInitiale={requeteInitiale} />

      <p className={styles.avertissement}>{t("avertissement")}</p>
    </main>
  );
}
