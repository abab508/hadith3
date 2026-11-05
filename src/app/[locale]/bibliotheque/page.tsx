import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ImageDecorative from "@/composants/ImageDecorative";
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
        <div className={styles.decorBibliotheque} aria-hidden="true">
          <ImageDecorative src="/images/bibliotheque/salle-lecture.webp" sizes="100vw" className={styles.imageBibliotheque} preload />
          <span className={styles.lumiere} />
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={styles.poussiere} style={{ ["--i" as string]: i }} />
          ))}
        </div>
        <span className={styles.sceau} aria-hidden="true">۞</span>
        {titreArabe && <p className={`${styles.surtitre} texte-arabe`} lang="ar" dir="rtl">{titreArabe}</p>}
        <h1 id="titre-bibliotheque" className={styles.titre}>{t("titre")}</h1>
        <p className={styles.sousTitre}>{t("sousTitre", { total })}</p>
      </section>

      <Bibliotheque rayons={rayons()} requeteInitiale={requeteInitiale} />

      <p className={styles.avertissement}>{t("avertissement")}</p>
    </main>
  );
}
