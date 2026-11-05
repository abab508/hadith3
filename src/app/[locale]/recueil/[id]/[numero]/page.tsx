import EntetePatrimoine from "@/composants/EntetePatrimoine";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { catalogueRecueils } from "@/donnees/recueils";
import { blocDe, hadithKg, validerRecueil, type HadithKg } from "@/donnees/recueils-kg";
import styles from "@/app/[locale]/hadith/[recueil]/[langue]/[numero]/Hadith.module.css";

type Parametres = { locale: string; id: string; numero: string };

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { id, numero } = await params;
  const r = catalogueRecueils.recueils.find((x) => x.id === id);
  return { title: r ? `${r.nom} · n° ${numero}` : "Hadith", robots: { index: false, follow: true } };
}

// Un hadith d'un recueil de la bibliothèque : texte arabe et bouton vers le rapport (autre page).
export default async function PageHadithRecueil({ params }: { params: Promise<Parametres> }) {
  const { locale, id, numero } = await params;
  setRequestLocale(locale);
  const valide = validerRecueil(id, numero);
  const fiche = catalogueRecueils.recueils.find((x) => x.id === id);
  if (!valide?.n || !fiche) notFound();
  const { recueil, n } = valide;
  const t = await getTranslations("recueilKg");
  const tc = await getTranslations("rapportTexte");

  let hadith: HadithKg | null = null;
  let echec = false;
  try { hadith = await hadithKg(recueil, n); } catch { echec = true; }

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href={`/recueil/${id}?page=${blocDe(n)}`}>← {t("retourRecueil")}</Link></p>
      <EntetePatrimoine scene="lecture" compacte className={styles.entete}>
        <p className={styles.surtitre}>{t("surtitre")}</p>
        <h1 className={styles.titre}><bdi lang="ar-Latn">{fiche.nom}</bdi></h1>
        <p className={styles.reference}>
          <bdi dir="ltr">{t("numero", { n })}</bdi>
          {hadith ? <> · {t("refSource", { ref: hadith.ref })}</> : null}
        </p>
      </EntetePatrimoine>

      {echec || !hadith ? (
        <section className={styles.cadre} role="status"><p>{echec ? t("indisponible") : t("introuvable")}</p></section>
      ) : (
        <>
          <p className={styles.boutons}>
            <Link href={`/recueil/${id}/${n}/rapport`} className={styles.bouton}>{tc("bouton")} <span aria-hidden="true">→</span></Link>
          </p>
          <section className={styles.cadre} aria-labelledby="texte-arabe">
            <h2 id="texte-arabe" className={styles.titreBloc}>{t("texteArabe")}</h2>
            <p lang="ar" dir="rtl" className={`texte-arabe ${styles.arabe}`}>{hadith.texte}</p>
          </section>
          <p className={styles.mention}>{hadith.chaines?.length ? t("avecChaine", { count: hadith.chaines.length }) : t("sansChaine")}</p>
          <nav className={styles.boutons} aria-label={t("pages")}>
            {n > 1 && <Link href={`/recueil/${id}/${n - 1}`}>← {t("precedent")}</Link>}
            {n < recueil.nombre && <Link href={`/recueil/${id}/${n + 1}`}>{t("suivant")} →</Link>}
          </nav>
          <p className={styles.mention}>{t("source")}</p>
        </>
      )}
    </main>
  );
}
