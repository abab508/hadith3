import EntetePatrimoine from "@/composants/EntetePatrimoine";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  PROPHETES, chapitresDesProphetes, critiques, estSerie, filtrer, personnesDe, recueilsDeLAuteur, type EntreePersonne,
} from "@/donnees/biographies";
import { titreKg } from "@/donnees/chapitres-kg";
import { catalogueRecueils } from "@/donnees/recueils";
import { ecritLatin, translitererNom } from "@/donnees/translitteration";
import styles from "../Biographies.module.css";

type Parametres = { locale: string; serie: string };
const TAILLE_PAGE = 60;

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { locale, serie } = await params;
  const t = await getTranslations({ locale, namespace: "biographies" });
  return { title: estSerie(serie) ? `${t(`series.${serie}.titre`)} · ${t("titre")}` : t("titre") };
}

export default async function PageSerie({ params, searchParams }: { params: Promise<Parametres>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const { locale, serie } = await params;
  if (!estSerie(serie)) notFound();
  setRequestLocale(locale);
  const { q, page } = await searchParams;
  const requete = typeof q === "string" ? q.slice(0, 80) : "";
  const t = await getTranslations("biographies");
  const latin = ecritLatin(locale);

  const carte = ([id, usage, complet, deces, recits]: EntreePersonne, extra?: React.ReactNode) => {
    const translit = latin ? translitererNom(usage) : undefined;
    return (
      <li key={id}>
        <Link href={`/biographies/personne/${id}`} className={styles.personne} data-personne={id}>
          <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomAr}`}>{usage}</bdi>
          {translit && <bdi lang="ar-Latn" dir="ltr" className={styles.nomLatin}>{translit}</bdi>}
          {complet !== usage && <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomComplet}`}>{complet}</bdi>}
          <span className={styles.details}>
            {deces && <span>{t("deces", { annee: deces })}</span>}
            {recits > 0 && <span>{t("recits", { n: recits })}</span>}
          </span>
          {extra}
        </Link>
      </li>
    );
  };

  let contenu: React.ReactNode;
  if (serie === "prophetes") {
    const parProphete = chapitresDesProphetes();
    contenu = (
      <>
        <p className={styles.intro}>{t("prophetesAide")}</p>
        <ul className={styles.prophetes}>
          <li className={styles.prophete} data-prophete="muhammad">
            <details>
              <summary><span className={styles.nomSerie}>{t("mohammed")}</span></summary>
              <ul className={styles.chapitres}>
                <li>{t("mohammedTexte")} <Link href="/themes/vie-du-prophete">{t("voirTheme")} →</Link></li>
              </ul>
            </details>
          </li>
          {PROPHETES.map((p) => {
            const liste = parProphete.get(p.cle) ?? [];
            return (
              <li key={p.cle} className={styles.prophete} data-prophete={p.cle}>
                <details>
                  <summary>
                    <span className={styles.nomSerie}>{latin ? p.latin : <bdi lang="ar" dir="rtl" className="texte-arabe">{p.ar}</bdi>}</span>
                    {latin && <bdi lang="ar" dir="rtl" className="texte-arabe">{p.ar}</bdi>}
                    <span className={styles.compte}>{t("nbChapitres", { n: liste.length })}</span>
                  </summary>
                  {liste.length === 0 ? <p className={styles.vide}>{t("aucunChapitre")}</p> : (
                    <ul className={styles.chapitres}>
                      {liste.map((c) => {
                        const titre = titreKg(c.titre, locale);
                        return (
                          <li key={c.href}>
                            <Link href={c.href}><bdi lang={titre.langue} dir="auto">{titre.texte}</bdi></Link>
                            {" "}<span className={styles.nombre}>({t("nbHadiths", { n: c.nombre })})</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </details>
              </li>
            );
          })}
        </ul>
        <p className={styles.mention}>{t("sourceChapitres")}</p>
      </>
    );
  } else if (serie === "savants") {
    const nomRecueil = (id: string) => catalogueRecueils.recueils.find((r) => r.id === id)?.nom ?? id;
    contenu = (
      <>
        <section aria-labelledby="titre-auteurs">
          <h2 id="titre-auteurs" className={styles.titreBloc}>{t("auteurs")}</h2>
          <ul className={styles.personnes}>
            {personnesDe("auteurs").map((p) => carte(p, (
              <span className={styles.details}>{recueilsDeLAuteur(p[0]).map((r) => <bdi key={r} lang="ar-Latn">{nomRecueil(r)}</bdi>)}</span>
            )))}
          </ul>
        </section>
        <section aria-labelledby="titre-critiques">
          <h2 id="titre-critiques" className={styles.titreBloc}>{t("critiques")}</h2>
          <p className={styles.intro}>{t("critiquesAide")}</p>
          <ul className={styles.personnes}>
            {critiques().map(([id, usage, complet, deces, rang, n]) => (
              <li key={id} className={styles.personne} data-critique={id}>
                <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomAr}`}>{usage}</bdi>
                {complet !== usage && <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomComplet}`}>{complet}</bdi>}
                {rang && <bdi lang="ar" dir="rtl" className="texte-arabe">{rang}</bdi>}
                <span className={styles.details}>
                  {deces > 0 && <span>{t("deces", { annee: deces })}</span>}
                  <span>{t("nbJugements", { n })}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  } else {
    const liste = filtrer(personnesDe(serie), requete);
    const total = Math.max(1, Math.ceil(liste.length / TAILLE_PAGE));
    const courant = Math.min(Math.max(1, Number.parseInt(page ?? "1", 10) || 1), total);
    const lien = (p: number) => `/biographies/${serie}?${new URLSearchParams({ ...(requete ? { q: requete } : {}), page: String(p) })}`;
    const tk = await getTranslations("recueilKg");
    const pagination = total > 1 && (
      <nav className={styles.pagination} aria-label={tk("pages")}>
        {courant > 1 ? <Link href={lien(courant - 1)}>← {tk("precedente")}</Link> : <span />}
        <span>{tk("page", { page: courant, total })}</span>
        {courant < total ? <Link href={lien(courant + 1)}>{tk("suivante")} →</Link> : <span />}
      </nav>
    );
    contenu = (
      <>
        <form className={styles.outils} action={`/${locale}/biographies/${serie}`} method="get" role="search">
          <label htmlFor="q-bio" className="visuellement-cache">{t("rechercher")}</label>
          <input id="q-bio" name="q" type="search" dir="auto" defaultValue={requete} placeholder={t("rechercher")} />
          <button type="submit">{t("chercher")}</button>
          <span className={styles.compte} aria-live="polite">{t("compteur", { n: liste.length })}</span>
        </form>
        {pagination}
        {liste.length === 0 ? <p className={styles.vide}>{t("aucun")}</p> : (
          <ul className={styles.personnes}>{liste.slice((courant - 1) * TAILLE_PAGE, courant * TAILLE_PAGE).map((p) => carte(p))}</ul>
        )}
        {pagination}
      </>
    );
  }

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href="/biographies">← {t("retour")}</Link></p>
      <EntetePatrimoine scene="biographies" compacte className={styles.entete}>
        <p className={styles.surtitre}>{t("titre")}</p>
        <h1 className={styles.titre}>{t(`series.${serie}.titre`)}</h1>
        <p className={styles.intro}>{t(`series.${serie}.description`)}</p>
      </EntetePatrimoine>
      {contenu}
      <p className={styles.mention}>{t("avertissement")}</p>
      {serie !== "prophetes" && <p className={styles.mention}>{t("source")}</p>}
    </main>
  );
}
