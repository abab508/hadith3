import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TYPES_CONTENU, depot, type TypeContenu } from "@/lib/contenus/depot";
import styles from "./Actualites.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "actualites" });
  return { title: t("titre"), description: t("intro") };
}

const estType = (v: unknown): v is TypeContenu => typeof v === "string" && (TYPES_CONTENU as readonly string[]).includes(v);

export default async function PageActualites({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ rubrique?: string }> }) {
  const { locale } = await params;
  const { rubrique } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("actualites");
  const type = estType(rubrique) ? rubrique : undefined;
  const d = depot();
  let contenus = d ? await d.lister({ publiesSeulement: true, type }).catch(() => null) : null;
  const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso)) : "");

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.surtitre}>{t("surtitre")}</p>
      <h1 className={styles.titre}>{t("titre")}</h1>
      <p className={styles.intro}>{t("intro")}</p>
      <ul className={styles.onglets} aria-label={t("rubriques.titre")}>
        <li><Link href="/actualites" aria-current={!type ? "page" : undefined}>{t("rubriques.tous")}</Link></li>
        {TYPES_CONTENU.map((r) => (
          <li key={r}><Link href={`/actualites?rubrique=${r}`} aria-current={type === r ? "page" : undefined}>{t(`rubriques.${r}`)}</Link></li>
        ))}
      </ul>
      {contenus === null ? <p className={styles.vide}>{t("bientot")}</p>
        : contenus.length === 0 ? <p className={styles.vide}>{t("aucun")}</p> : (
          <ul className={styles.liste}>
            {contenus.map((c) => (
              <li key={c.id}>
                <Link href={`/actualites/${encodeURIComponent(c.slug)}`} className={styles.carte} data-contenu={c.slug}>
                  <span className={styles.meta}>
                    <span className={styles.badge}>{t(`rubriques.${c.type}`)}</span>
                    {c.publieLe && <time dateTime={c.publieLe}>{date(c.publieLe)}</time>}
                    {c.pdfUrl && <span>PDF</span>}
                  </span>
                  <h2 className={styles.nomCarte} lang={c.langue} dir="auto">{c.titre}</h2>
                  {c.resume && <p className={styles.resume} lang={c.langue} dir="auto">{c.resume}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      <p className={styles.mention}>{t("mention")}</p>
    </main>
  );
}
