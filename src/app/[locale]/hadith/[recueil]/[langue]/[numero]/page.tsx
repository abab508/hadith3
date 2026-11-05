import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { corpus } from "@/donnees/corpus";
import { loadDetail, validDetailParams } from "@/donnees/fiche-distante";
import { editionReferenceUrl } from "@/donnees/recherche-distante";
import { recueilPublic } from "@/donnees/recueils-publics";
import styles from "./Hadith.module.css";
import liste from "@/app/[locale]/recueil/[id]/Recueil.module.css";

type Parametres = { locale: string; recueil: string; langue: string; numero: string };

// Libellé de la langue d'une édition (codes de l'édition publique, pas une liste de langues de l'interface).
const nomsEditions: Record<string, string> = { ara: "العربية", fra: "Français", eng: "English", urd: "اردو", tur: "Türkçe", ind: "Bahasa Indonesia" };
const balise = (l: string) => ({ ara: "ar", fra: "fr", eng: "en", urd: "ur", tur: "tr", ind: "id" } as Record<string, string>)[l] ?? "und";
const sens = (l: string) => (l === "ara" || l === "urd" ? "rtl" : "ltr");

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { recueil, langue, numero } = await params;
  const v = validDetailParams(recueil, langue, numero);
  return { title: v ? `${v.collection.nom} · n° ${numero}` : "Hadith", robots: { index: false, follow: true } };
}

export default async function PageHadith({ params }: { params: Promise<Parametres> }) {
  const { locale, recueil, langue, numero } = await params;
  setRequestLocale(locale);
  const valide = validDetailParams(recueil, langue, numero);
  if (!valide) notFound();
  const t = await getTranslations("fiche");
  const tr = await getTranslations("recueils");
  const tc = await getTranslations("rapportTexte");
  const tk = await getTranslations("recueilKg");
  const tp = await getTranslations("recueilPublic");
  const { collection, number } = valide;

  let detail: Awaited<ReturnType<typeof loadDetail>> = null;
  let echec = false;
  try { detail = await loadDetail(recueil, langue, numero); } catch { echec = true; }

  // Rapport détaillé disponible si ce hadith fait partie du corpus analysé (même recueil, même numéro).
  const analyse = corpus.hadiths.find((h) => h.occurrences.some((o) => o.ouvrage === collection.id && o.numero === String(number)));
  const source = detail?.sourceUrl ?? editionReferenceUrl(collection.key, langue, number);
  const textes = detail
    ? [{ langue: detail.language as string, texte: detail.hadith.text }, ...(detail.other ? [{ langue: detail.other.language as string, texte: detail.other.hadith.text }] : [])]
        .sort((a, b) => (a.langue === "ara" ? -1 : b.langue === "ara" ? 1 : 0))
    : [];
  const jugements = (detail?.hadith.grades ?? []).filter((g) => g?.name && g?.grade);
  // Lecture à la suite : retour au livre du recueil et hadiths voisins (numérotation de l'édition publique).
  const sommaire = recueilPublic(recueil)?.sommaire;
  const livreSource = detail?.hadith.reference?.book;
  const lienRecueil = `/recueil/${recueil}${typeof livreSource === "number" && Number.isSafeInteger(livreSource) ? `?livre=${livreSource}` : ""}`;

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}>
        <Link href="/recherche">← {t("retour")}</Link>
        {sommaire && <> · <Link href={lienRecueil}>{tp("voirRecueil")}</Link></>}
      </p>
      <header className={styles.entete}>
        <p className={styles.surtitre}>{tr("titre")}</p>
        <h1 className={styles.titre}><bdi lang="ar-Latn">{collection.nom}</bdi></h1>
        <p className={styles.reference}>
          <bdi dir="ltr">{tr("numero", { numero: number })}</bdi>
          {detail?.hadith.reference?.book ? <> · {tr("livre", { livre: detail.hadith.reference.book })}</> : null}
        </p>
      </header>

      {sommaire && (
        <nav className={liste.pagination} aria-label={tp("voisins")}>
          {number > 1 ? <Link href={`/hadith/${recueil}/${langue}/${number - 1}`}>← {tk("precedent")}</Link> : <span />}
          {number < sommaire.dernier ? <Link href={`/hadith/${recueil}/${langue}/${number + 1}`}>{tk("suivant")} →</Link> : <span />}
        </nav>
      )}

      {/* Le bouton qui mène au rapport et à toute la chaîne de transmission, sur une autre page. */}
      <p className={styles.boutons}>
        <Link href={`/hadith/${recueil}/${langue}/${numero}/rapport`} className={styles.bouton}>{tc("bouton")} <span aria-hidden="true">→</span></Link>
      </p>

      {echec || !detail ? (
        <section className={styles.cadre} role="status">
          <p>{echec ? t("erreur") : t("introuvable")}</p>
          <a href={source} target="_blank" rel="noopener noreferrer">{t("source")} ↗</a>
        </section>
      ) : (
        <>
          <div className={styles.textes}>
            {textes.map(({ langue: l, texte }) => (
              <section key={l} className={styles.cadre} aria-labelledby={`texte-${l}`}>
                <h2 id={`texte-${l}`} className={styles.titreBloc}>{l === "ara" ? t("texteArabe") : t("traduction", { langue: nomsEditions[l] ?? l })}</h2>
                <p lang={balise(l)} dir={sens(l)} className={l === "ara" ? `texte-arabe ${styles.arabe}` : styles.prose}>{texte}</p>
              </section>
            ))}
          </div>
          <p className={styles.mention}>{detail.counterpartStatus === "matched" ? `✓ ${t("concordant")}` : t("nonConcordant")}</p>

          <section className={styles.cadre} aria-labelledby="titre-chaine">
            <h2 id="titre-chaine" className={styles.titreBloc}>{t("chaineTitre")}</h2>
            {analyse ? (
              <>
                <p>{t("rapportDispo")}</p>
                <Link href={`/rapport/${analyse.id}`} className={styles.bouton}>{t("ouvrirRapport")} <span aria-hidden="true">→</span></Link>
              </>
            ) : (
              <p>{t("chaineTexte")}</p>
            )}
          </section>

          <section className={styles.cadre} aria-labelledby="titre-jugements">
            <h2 id="titre-jugements" className={styles.titreBloc}>{t("jugements")}</h2>
            {jugements.length > 0 ? (
              <ul className={styles.jugements}>
                {jugements.map((g) => <li key={`${g.name}-${g.grade}`}><bdi>{g.name}</bdi> : <bdi>{g.grade}</bdi></li>)}
              </ul>
            ) : <p>{t("aucunJugement")}</p>}
          </section>

          <p className={styles.mention}>{t("provenance")} · <a href={source} target="_blank" rel="noopener noreferrer">{t("source")} ↗</a></p>
          <p className={styles.mention}>{tr("avertissement")}</p>
        </>
      )}
    </main>
  );
}
