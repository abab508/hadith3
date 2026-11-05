import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FormulaireReponse } from "@/composants/FormulairesForum";
import { depotForum } from "@/lib/forum/depot";
import { membreDeLaPage } from "@/lib/forum/membre-serveur";
import styles from "../Forum.module.css";

export const dynamic = "force-dynamic";
type Parametres = { locale: string; id: string };
const lireId = (id: string) => (/^\d{1,9}$/.test(id) ? Number(id) : NaN);

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { id } = await params;
  const s = await depotForum()?.sujet(lireId(id), false).catch(() => null);
  return s ? { title: s.titre } : {};
}

export default async function PageSujet({ params }: { params: Promise<Parametres> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const d = depotForum();
  const n = lireId(id);
  const sujet = d && Number.isSafeInteger(n) ? await d.sujet(n, false).catch(() => null) : null;
  if (!d || !sujet) notFound();
  const membre = await membreDeLaPage();
  const messages = await d.messages(sujet.id, membre?.id ?? null, false);
  const t = await getTranslations("forum");
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href="/forum">← {t("retour")}</Link></p>
      <h1 className={styles.titre} dir="auto">{sujet.titre}</h1>
      {sujet.ferme && <p className={styles.note}>{t("fermeAide")}</p>}
      <ol className={styles.liste}>
        {messages.map((m) => (
          <li key={m.id} className={`${styles.message} ${m.statut === "retenu" ? styles.attente : ""}`} data-message={m.id}>
            <span className={styles.meta}>
              <bdi dir="auto" className={styles.badge}>{m.auteurNom}</bdi>
              <time dateTime={m.creeLe}>{date(m.creeLe)}</time>
            </span>
            <p dir="auto">{m.corps}</p>
            {m.statut === "retenu" && <span className={styles.note}>{t("enAttente")}</span>}
          </li>
        ))}
      </ol>
      {sujet.ferme ? null : membre ? <FormulaireReponse sujetId={sujet.id} />
        : <p className={styles.note}>{t("connectezVous")} <Link href="/compte">{t("connecter")}</Link></p>}
    </main>
  );
}
