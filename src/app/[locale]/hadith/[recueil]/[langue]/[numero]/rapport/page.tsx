import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { corpus } from "@/donnees/corpus";
import { loadDetail, validDetailParams } from "@/donnees/fiche-distante";
import { editionReferenceUrl } from "@/donnees/recherche-distante";
import { extraireChaine } from "@/donnees/isnad-texte";
import styles from "../Hadith.module.css";

type Parametres = { locale: string; recueil: string; langue: string; numero: string };

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { recueil, langue, numero } = await params;
  const v = validDetailParams(recueil, langue, numero);
  return { title: v ? `${v.collection.nom} · n° ${numero} · isnād` : "Hadith", robots: { index: false, follow: true } };
}

// Rapport d'un hadith des grands recueils : la chaîne est découpée depuis le texte ARABE de l'édition,
// sans identification ni jugement des transmetteurs. Le corpus analysé garde son propre rapport détaillé.
export default async function RapportTexte({ params }: { params: Promise<Parametres> }) {
  const { locale, recueil, langue, numero } = await params;
  setRequestLocale(locale);
  const valide = validDetailParams(recueil, langue, numero);
  if (!valide) notFound();
  const t = await getTranslations("rapportTexte");
  const tf = await getTranslations("fiche");
  const tr = await getTranslations("recueils");
  const { collection, number } = valide;

  // Le texte arabe porte la chaîne ; on le charge même si la page a été ouverte depuis le français.
  let arabe: Awaited<ReturnType<typeof loadDetail>> = null;
  let echec = false;
  try { arabe = await loadDetail(recueil, "ara", numero); } catch { echec = true; }
  const texteAr = arabe?.hadith.text ?? "";
  const traduction = arabe?.other?.language === "fra" ? arabe.other.hadith.text : null;
  const chaine = texteAr ? extraireChaine(texteAr) : { maillons: [], jusquAuProphete: false };
  // Ordre d'affichage : du Prophète ﷺ (en haut) vers le maître du compilateur.
  const maillons = [...chaine.maillons].reverse();
  const analyse = corpus.hadiths.find((h) => h.occurrences.some((o) => o.ouvrage === collection.id && o.numero === String(number)));
  const source = editionReferenceUrl(collection.key, "ara", number);

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href={`/hadith/${recueil}/${langue}/${numero}`}>← {t("retourHadith")}</Link></p>
      <header className={styles.entete}>
        <p className={styles.surtitre}>{t("titre")}</p>
        <h1 className={styles.titre}><bdi lang="ar-Latn">{collection.nom}</bdi></h1>
        <p className={styles.reference}><bdi dir="ltr">{tr("numero", { numero: number })}</bdi></p>
      </header>

      {analyse && (
        <section className={styles.cadre}>
          <p>{tf("rapportDispo")}</p>
          <Link href={`/rapport/${analyse.id}`} className={styles.bouton}>{tf("ouvrirRapport")} <span aria-hidden="true">→</span></Link>
        </section>
      )}

      {echec || !arabe ? (
        <section className={styles.cadre} role="status">
          <p>{echec ? tf("erreur") : tf("introuvable")}</p>
          <a href={source} target="_blank" rel="noopener noreferrer">{tf("source")} ↗</a>
        </section>
      ) : (
        <>
          <section className={styles.cadre} aria-labelledby="titre-isnad-texte">
            <h2 id="titre-isnad-texte" className={styles.titreBloc}>{t("chaine")}</h2>
            <p className={styles.mention}>{t("aide")}</p>
            {maillons.length === 0 ? (
              <p>{t("pasDeChaine")}</p>
            ) : (
              <>
                <p className={styles.mention}>{t("ordre")}</p>
                <ol className={styles.ligne}>
                  {chaine.jusquAuProphete && (
                    <li className={styles.maillon} data-prophete>
                      <span className={styles.point} aria-hidden="true" />
                      <span lang="ar" dir="rtl" className={`texte-arabe ${styles.nom}`}>النبي ﷺ</span>
                      <span className={styles.statut}>{t("prophete")}</span>
                    </li>
                  )}
                  {maillons.map((nom, i) => (
                    <li key={`${i}-${nom}`} className={styles.maillon} style={{ ["--i" as string]: i }}>
                      <span className={styles.point} aria-hidden="true" />
                      <span lang="ar" dir="rtl" className={`texte-arabe ${styles.nom}`}>{nom}</span>
                      <span className={styles.statut}>{t("nonEvalue")}</span>
                    </li>
                  ))}
                  <li className={styles.maillon} data-recueil>
                    <span className={styles.point} aria-hidden="true" />
                    <span className={styles.nom}><bdi lang="ar-Latn">{collection.nom}</bdi></span>
                    <span className={styles.statut}>{t("recueil")}</span>
                  </li>
                </ol>
                {!chaine.jusquAuProphete && <p className={styles.mention}>{t("nonProphete")}</p>}
              </>
            )}
          </section>

          <section className={styles.cadre} aria-labelledby="titre-texte-complet">
            <h2 id="titre-texte-complet" className={styles.titreBloc}>{t("texteComplet")}</h2>
            <p lang="ar" dir="rtl" className={`texte-arabe ${styles.arabe}`}>{texteAr}</p>
            {traduction && <p lang="fr" className={styles.prose}>{traduction}</p>}
          </section>

          <p className={styles.mention}>{tf("provenance")} · <a href={source} target="_blank" rel="noopener noreferrer">{tf("source")} ↗</a></p>
          <p className={styles.mention}>{tr("avertissement")}</p>
        </>
      )}
    </main>
  );
}
