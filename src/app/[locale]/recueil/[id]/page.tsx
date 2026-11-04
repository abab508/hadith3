import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { catalogueRecueils } from "@/donnees/recueils";
import { blocKg, extrait, nombreBlocs, validerRecueil, type HadithKg } from "@/donnees/recueils-kg";
import styles from "@/app/[locale]/hadith/[recueil]/[langue]/[numero]/Hadith.module.css";
import liste from "./Recueil.module.css";

type Parametres = { locale: string; id: string };

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { id } = await params;
  const r = catalogueRecueils.recueils.find((x) => x.id === id);
  return { title: r ? `${r.nom} · ${r.nomAr}` : "Recueil" };
}

// Un recueil de la bibliothèque : ses hadiths, 100 par page, tirés du dépôt de données public.
export default async function PageRecueil({ params, searchParams }: { params: Promise<Parametres>; searchParams: Promise<{ page?: string; n?: string }> }) {
  const { locale, id } = await params;
  const { page, n } = await searchParams;
  setRequestLocale(locale);
  const valide = validerRecueil(id);
  const fiche = catalogueRecueils.recueils.find((x) => x.id === id);
  if (!valide || !fiche) notFound();
  const { recueil } = valide;
  if (typeof n === "string" && validerRecueil(id, n.trim())?.n) redirect({ href: `/recueil/${id}/${Number(n.trim())}`, locale });
  const t = await getTranslations("recueilKg");
  const total = nombreBlocs(recueil);
  const courant = Math.min(Math.max(1, Number.parseInt(page ?? "1", 10) || 1), total);

  let hadiths: HadithKg[] = [];
  let echec = false;
  try { hadiths = await blocKg(recueil, courant); } catch { echec = true; }

  const pagination = (
    <nav className={liste.pagination} aria-label={t("pages")}>
      {courant > 1 ? <Link href={`/recueil/${id}?page=${courant - 1}`}>← {t("precedente")}</Link> : <span />}
      <span>{t("page", { page: courant, total })}</span>
      {courant < total ? <Link href={`/recueil/${id}?page=${courant + 1}`}>{t("suivante")} →</Link> : <span />}
    </nav>
  );

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href="/bibliotheque">← {t("retourBibliotheque")}</Link></p>
      <header className={styles.entete}>
        <p className={styles.surtitre}>{t("surtitre")}</p>
        <h1 className={styles.titre}><bdi lang="ar-Latn">{fiche.nom}</bdi></h1>
        <p lang="ar" dir="rtl" className={`texte-arabe ${liste.nomAr}`}>{fiche.nomAr}</p>
        <p className={styles.reference}>{t("compte", { nombre: recueil.nombre, avecChaine: recueil.avecChaine })}</p>
      </header>

      <form className={liste.aller} action={`/${locale}/recueil/${id}`} method="get">
        <label htmlFor="aller-numero">{t("aller")}</label>
        <input id="aller-numero" name="n" type="number" inputMode="numeric" min={1} max={recueil.nombre} required />
        <button type="submit">{t("ouvrir")}</button>
      </form>

      {pagination}
      {echec ? (
        <section className={styles.cadre} role="status"><p>{t("indisponible")}</p></section>
      ) : (
        <ol className={liste.liste}>
          {hadiths.map((h) => (
            <li key={h.n}>
              <Link href={`/recueil/${id}/${h.n}`} className={liste.entree}>
                <span className={liste.numero}>{t("numero", { n: h.n })}</span>
                <span className={liste.corps}>
                  <span lang="ar" dir="rtl" className={`texte-arabe ${liste.extrait}`}>{extrait(h.texte)}</span>
                  <span className={liste.marque}>{h.chaines?.length ? t("avecChaine", { count: h.chaines.length }) : t("sansChaine")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {pagination}
      <p className={styles.mention}>{t("source")}</p>
    </main>
  );
}
