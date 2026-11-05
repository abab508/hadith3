import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { depotForum } from "@/lib/forum/depot";
import { membreDeLaPage } from "@/lib/forum/membre-serveur";
import ReglesForum from "@/composants/ReglesForum";
import styles from "./Forum.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forum" });
  return { title: t("titre"), description: t("intro") };
}

export default async function PageForum({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forum");
  const d = depotForum();
  const [sujets, membre] = d ? await Promise.all([d.listerSujets(false).catch(() => null), membreDeLaPage()]) : [null, null];
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.surtitre}>{t("surtitre")}</p>
      <h1 className={styles.titre}>{t("titre")}</h1>
      <p className={styles.intro}>{t("intro")}</p>
      {sujets === null ? <p className={styles.vide}>{t("indisponible")}</p> : (
        <>
          <div className={styles.barre}>
            {membre ? <Link href="/forum/nouveau" className={styles.bouton}>{t("nouvelle")}</Link>
              : <Link href="/compte" className={styles.bouton}>{t("connecter")}</Link>}
            {membre && <Link href="/compte">{t("monCompte", { nom: membre.nom })}</Link>}
          </div>
          <ReglesForum />
          {sujets.length === 0 ? <p className={styles.vide}>{t("aucune")}</p> : (
            <ul className={styles.liste}>
              {sujets.map((s) => (
                <li key={s.id}>
                  <Link href={`/forum/${s.id}`} className={styles.sujet} data-sujet={s.id}>
                    <h2 className={styles.nomSujet} dir="auto">{s.titre}</h2>
                    <span className={styles.meta}>
                      <span><bdi dir="auto">{t("par", { nom: s.auteurNom })}</bdi></span>
                      <span>{t("reponses", { n: s.nbMessages })}</span>
                      <time dateTime={s.dernierLe}>{date(s.dernierLe)}</time>
                      {s.ferme && <span className={styles.badge}>{t("ferme")}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
