import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FormulaireNouveauMotDePasse } from "@/composants/FormulairesForum";
import styles from "../../forum/Forum.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compte" });
  // Pas d'indexation, et l'adresse de la page n'est pas transmise aux autres sites.
  return { title: t("titreNouveau"), robots: { index: false }, referrer: "no-referrer" };
}

export default async function PageNouveauMotDePasse({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("compte");
  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href="/compte">← {t("titre")}</Link></p>
      <h1 className={styles.titre}>{t("titreNouveau")}</h1>
      <FormulaireNouveauMotDePasse />
    </main>
  );
}
