import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FormulaireCompte } from "@/composants/FormulairesForum";
import { depotForum } from "@/lib/forum/depot";
import { membreDeLaPage } from "@/lib/forum/membre-serveur";
import { sessionsMembresPossibles } from "@/lib/forum/securite";
import styles from "../forum/Forum.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compte" });
  return { title: t("titre"), robots: { index: false } };
}

export default async function PageCompte({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("compte");
  const possible = depotForum() !== null && sessionsMembresPossibles();
  const membre = possible ? await membreDeLaPage() : null;
  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href="/forum">← {t("allerForum")}</Link></p>
      <h1 className={styles.titre}>{t("titre")}</h1>
      {possible ? <FormulaireCompte membre={membre ? { nom: membre.nom } : null} /> : <p className={styles.vide}>{t("erreurs.indisponible")}</p>}
    </main>
  );
}
