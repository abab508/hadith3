import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import TexteContenu from "@/composants/TexteContenu";
import { depot } from "@/lib/contenus/depot";
import { lienPdf } from "@/lib/contenus/pdf";
import styles from "../Actualites.module.css";

export const dynamic = "force-dynamic";
type Parametres = { locale: string; slug: string };

async function lire(slug: string) {
  const c = await depot()?.lireParSlug(decodeURIComponent(slug)).catch(() => null);
  return c?.publie ? c : null;
}

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await lire(slug);
  return c ? { title: c.titre, description: c.resume || undefined } : {};
}

export default async function PageContenu({ params }: { params: Promise<Parametres> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = await lire(slug);
  if (!c) notFound();
  const t = await getTranslations("actualites");
  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href="/actualites">← {t("retour")}</Link></p>
      <p className={styles.surtitre}>{t(`rubriques.${c.type}`)}</p>
      <h1 className={styles.titre} lang={c.langue} dir="auto">{c.titre}</h1>
      {c.publieLe && <p className={styles.mention}><time dateTime={c.publieLe}>{t("publieLe", { date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(c.publieLe)) })}</time></p>}
      {c.resume && <p className={styles.intro} lang={c.langue} dir="auto">{c.resume}</p>}
      <div lang={c.langue}><TexteContenu texte={c.corps} className={styles.corps} /></div>
      {c.pdfUrl && <a className={styles.pdf} href={lienPdf(c.pdfUrl)} target="_blank" rel="noopener noreferrer">{t("pdf")} {c.pdfNom ? <bdi dir="auto">({c.pdfNom})</bdi> : null} ↗</a>}
      <p className={styles.mention}>{t("mention")}</p>
    </main>
  );
}
