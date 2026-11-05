import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FormulaireSujet } from "@/composants/FormulairesForum";
import { membreDeLaPage } from "@/lib/forum/membre-serveur";
import ReglesForum from "@/composants/ReglesForum";
import styles from "../Forum.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forum" });
  return { title: t("nouvelle"), robots: { index: false } };
}

export default async function PageNouveauSujet({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forum");
  const membre = await membreDeLaPage();
  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href="/forum">← {t("retour")}</Link></p>
      <h1 className={styles.titre}>{t("nouvelle")}</h1>
      <ReglesForum />
      {membre ? <FormulaireSujet /> : <p className={styles.note}>{t("connectezVous")} <Link href="/compte">{t("connecter")}</Link></p>}
    </main>
  );
}
