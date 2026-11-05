import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fetchRemoteSection, type RemoteRow } from "@/donnees/recherche-distante";
import { extrait } from "@/donnees/recueils-kg";
import type { CollectionPublique } from "@/donnees/recherche-distante";
import type { SommairePublic } from "@/donnees/recueils-publics";
import type { Recueil } from "@/donnees/schemas/recueil";
import styles from "@/app/[locale]/hadith/[recueil]/[langue]/[numero]/Hadith.module.css";
import liste from "@/app/[locale]/recueil/[id]/Recueil.module.css";

const TAILLE_PAGE = 100;
// Seuls les numéros entiers ont une fiche /hadith/... (la source a quelques numéros décimaux).
const numeroFiche = (n: number) => Number.isSafeInteger(n) && n >= 1 && n <= 100000;

// Recueil lu depuis l'édition publique : sommaire des livres, puis les hadiths d'un livre, 100 par page.
export default async function RecueilPublic({ locale, fiche, collection, sommaire, livre, page }: {
  locale: string; fiche: Recueil; collection: CollectionPublique; sommaire: SommairePublic; livre?: string; page?: string;
}) {
  const t = await getTranslations("recueilKg");
  const tp = await getTranslations("recueilPublic");
  const id = collection.id;
  const index = livre === undefined ? -1 : sommaire.livres.findIndex(([s]) => String(s) === livre);
  const choisi = index >= 0 ? sommaire.livres[index] : undefined;

  let hadiths: RemoteRow[] = [];
  let echec = false;
  if (choisi) {
    try { hadiths = (await fetchRemoteSection(collection, "ara", choisi[0])).hadiths ?? []; } catch { echec = true; }
  }
  const total = Math.max(1, Math.ceil(hadiths.length / TAILLE_PAGE));
  const courant = Math.min(Math.max(1, Number.parseInt(page ?? "1", 10) || 1), total);
  const visibles = hadiths.slice((courant - 1) * TAILLE_PAGE, courant * TAILLE_PAGE);
  const nomLivre = ([s, titre]: SommairePublic["livres"][number]) => (s === 0 && !titre ? tp("horsLivre") : tp("livre", { n: s }));
  const lienLivre = (s: number, p?: number) => `/recueil/${id}?livre=${s}${p && p > 1 ? `&page=${p}` : ""}`;

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}>
        {choisi ? <Link href={`/recueil/${id}`}>← {tp("retourSommaire")}</Link> : <Link href="/bibliotheque">← {t("retourBibliotheque")}</Link>}
      </p>
      <header className={styles.entete}>
        <p className={styles.surtitre}>{t("surtitre")}</p>
        <h1 className={styles.titre}><bdi lang="ar-Latn">{fiche.nom}</bdi></h1>
        <p lang="ar" dir="rtl" className={`texte-arabe ${liste.nomAr}`}>{fiche.nomAr}</p>
        <p className={styles.reference}>{tp("compte", { nombre: sommaire.total, livres: sommaire.livres.filter(([s]) => s !== 0).length })}</p>
      </header>

      <form className={liste.aller} action={`/${locale}/recueil/${id}`} method="get">
        <label htmlFor="aller-numero">{t("aller")}</label>
        <input id="aller-numero" name="n" type="number" inputMode="numeric" min={1} max={sommaire.dernier} required />
        <button type="submit">{t("ouvrir")}</button>
      </form>

      {!choisi ? (
        <section aria-labelledby="titre-livres">
          <h2 id="titre-livres" className={styles.titreBloc}>{tp("livres")}</h2>
          <ol className={liste.liste}>
            {sommaire.livres.map((l) => (
              <li key={l[0]}>
                <Link href={lienLivre(l[0])} className={liste.entree}>
                  <span className={liste.numero}>{l[0] === 0 && !l[1] ? "—" : t("numero", { n: l[0] })}</span>
                  <span className={liste.corps}>
                    <span className={liste.titreSous}>{nomLivre(l)}{l[1] ? <> · <bdi lang="en">{l[1]}</bdi></> : null}</span>
                    <span className={liste.marque}>{tp("nbHadiths", { count: l[2] })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className={styles.mention}>{tp("titresSource")}</p>
        </section>
      ) : (
        <section aria-labelledby="titre-livre">
          <h2 id="titre-livre" className={styles.titreBloc}>
            {nomLivre(choisi)}{choisi[1] ? <> · <bdi lang="en">{choisi[1]}</bdi></> : null}
          </h2>
          <nav className={liste.pagination} aria-label={tp("navigationLivres")}>
            {index > 0 ? <Link href={lienLivre(sommaire.livres[index - 1]![0])}>← {tp("livrePrecedent")}</Link> : <span />}
            {total > 1 ? <span>{t("page", { page: courant, total })}</span> : <span />}
            {index < sommaire.livres.length - 1 ? <Link href={lienLivre(sommaire.livres[index + 1]![0])}>{tp("livreSuivant")} →</Link> : <span />}
          </nav>
          {echec ? (
            <section className={styles.cadre} role="status"><p>{t("indisponible")}</p></section>
          ) : (
            <ol className={liste.liste}>
              {visibles.map((h, i) => {
                const contenu = (
                  <>
                    <span className={liste.numero}>{t("numero", { n: h.hadithnumber })}</span>
                    <span className={liste.corps}>
                      <span lang="ar" dir="rtl" className={`texte-arabe ${liste.extrait}`}>{extrait(h.text ?? "")}</span>
                    </span>
                  </>
                );
                return (
                  <li key={`${h.hadithnumber}-${i}`}>
                    {numeroFiche(h.hadithnumber)
                      ? <Link href={`/hadith/${id}/ara/${h.hadithnumber}`} className={liste.entree}>{contenu}</Link>
                      : <div className={liste.entree}>{contenu}</div>}
                  </li>
                );
              })}
            </ol>
          )}
          {total > 1 && (
            <nav className={liste.pagination} aria-label={t("pages")}>
              {courant > 1 ? <Link href={lienLivre(choisi[0], courant - 1)}>← {t("precedente")}</Link> : <span />}
              <span>{t("page", { page: courant, total })}</span>
              {courant < total ? <Link href={lienLivre(choisi[0], courant + 1)}>{t("suivante")} →</Link> : <span />}
            </nav>
          )}
        </section>
      )}
      <p className={styles.mention}>{tp("source")}</p>
    </main>
  );
}
