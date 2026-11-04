import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { corpus } from "@/donnees/corpus";
import { loadDetail, validDetailParams } from "@/donnees/fiche-distante";
import { editionReferenceUrl } from "@/donnees/recherche-distante";
import { extraireChaine } from "@/donnees/isnad-texte";
import { categorieDepuisRang, chaineKg } from "@/donnees/fiches-kg";
import { avecLatin } from "@/donnees/translitteration";
import Embleme from "@/composants/Embleme";
import IconeTheme from "@/composants/IconeTheme";
import ChaineTexteRapport from "@/composants/ChaineTexteRapport";
import ui from "@/composants/Interface.module.css";
import rapport from "@/app/[locale]/rapport/[id]/Rapport.module.css";
import chaineStyles from "@/composants/ChaineRapport.module.css";
import styles from "../Hadith.module.css";

type Parametres = { locale: string; recueil: string; langue: string; numero: string };

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { recueil, langue, numero } = await params;
  const v = validDetailParams(recueil, langue, numero);
  return { title: v ? `${v.collection.nom} · n° ${numero} · isnād` : "Hadith", robots: { index: false, follow: true } };
}

// Rapport d'un hadith des grands recueils, dans la mise en page du rapport détaillé (capture du patron).
// La chaîne est découpée depuis le texte ARABE de l'édition, sans identification ni jugement des transmetteurs.
export default async function RapportTexte({ params }: { params: Promise<Parametres> }) {
  const { locale, recueil, langue, numero } = await params;
  setRequestLocale(locale);
  const valide = validDetailParams(recueil, langue, numero);
  if (!valide) notFound();
  const t = await getTranslations("rapportTexte");
  const tf = await getTranslations("fiche");
  const tr = await getTranslations("recueils");
  const tRapport = await getTranslations("rapport");
  const tAccueil = await getTranslations("accueil");
  const tEntete = await getTranslations("entete");
  const { collection, number } = valide;

  // Le texte arabe porte la chaîne ; on le charge même si la page a été ouverte depuis le français.
  let arabe: Awaited<ReturnType<typeof loadDetail>> = null;
  let echec = false;
  try { arabe = await loadDetail(recueil, "ara", numero); } catch { echec = true; }
  const texteAr = arabe?.hadith.text ?? "";
  const traduction = arabe?.other?.language === "fra" ? arabe.other.hadith.text : null;
  const chaine = texteAr ? extraireChaine(texteAr) : { maillons: [], jusquAuProphete: false };
  // Chaîne identifiée dans hadith-kg (vraies fiches) ; sinon, découpage automatique du texte en secours.
  const brutes = await chaineKg(collection.key, number);
  const fiches = brutes ? avecLatin(brutes, locale) : null;
  const mentionProphete = /(رسول الله|النبي)/u.test(texteAr.normalize("NFC").replace(/[\u064B-\u065F\u0670\u0640]/gu, ""));
  const analyse = corpus.hadiths.find((h) => h.occurrences.some((o) => o.ouvrage === collection.id && o.numero === String(number)));
  const source = editionReferenceUrl(collection.key, "ara", number);

  return (
    <main id="contenu" tabIndex={-1} className={`${ui.page} ${rapport.pageRapport}`}>
      <section className={rapport.banniere} aria-label={tRapport("banniere.titre")}>
        <img className={rapport.imageBanniere} src="/images/maquette/accueil.jpg" alt="" />
        <span className={rapport.voileBanniere} aria-hidden="true" />
        <Embleme nomLatin={tAccueil("titre")} nomArabe={tEntete("nomArabe")} mention={tRapport("banniere.surtitre")} />
        <p className={rapport.grandTitre}>{tRapport("banniere.titre")}</p>
        <p className={rapport.texteBanniere}>{tRapport("banniere.texte")}</p>
        <p className={rapport.ligneAnalyse}>
          <span className={rapport.filet} aria-hidden="true" />
          <a href="#titre-isnad-texte" className={rapport.pastilleAnalyse}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
            {tRapport("banniere.analyse")}
          </a>
          <span className={rapport.filet} aria-hidden="true" />
        </p>
      </section>

      <p className={styles.retour}><Link href={`/hadith/${recueil}/${langue}/${numero}`}>← {t("retourHadith")}</Link></p>
      <div className={styles.entete}>
        <h1 className={styles.titre}><bdi lang="ar-Latn">{collection.nom}</bdi></h1>
        <p className={styles.reference}><bdi dir="ltr">{tr("numero", { numero: number })}</bdi></p>
      </div>

      {analyse && (
        <section className={`${ui.carte} ${chaineStyles.cadreOr}`}>
          <p>{tf("rapportDispo")}</p>
          <Link href={`/rapport/${analyse.id}`} className={styles.bouton}>{tf("ouvrirRapport")} <span aria-hidden="true">→</span></Link>
        </section>
      )}

      {echec || !arabe ? (
        <section className={`${ui.carte} ${chaineStyles.cadreOr}`} role="status">
          <p>{echec ? tf("erreur") : tf("introuvable")}</p>
          <a href={source} target="_blank" rel="noopener noreferrer">{tf("source")} ↗</a>
        </section>
      ) : (
        <>
          {fiches
            ? <ChaineTexteRapport fiches={fiches} categories={fiches.map(categorieDepuisRang)} recueil={collection.nom} jusquAuProphete={mentionProphete} />
            : chaine.maillons.length > 0
            ? <ChaineTexteRapport maillons={chaine.maillons} recueil={collection.nom} jusquAuProphete={chaine.jusquAuProphete} />
            : <section className={`${ui.carte} ${chaineStyles.cadreOr}`}><p>{t("pasDeChaine")}</p></section>}

          <section className={`${ui.carte} ${chaineStyles.cadreOr}`} aria-labelledby="titre-texte-complet">
            <h2 id="titre-texte-complet" className={styles.titreBloc}>{t("texteComplet")}</h2>
            <p lang="ar" dir="rtl" className={`texte-arabe ${styles.arabe}`}>{texteAr}</p>
            {traduction && <p lang="fr" className={styles.prose}>{traduction}</p>}
            <p className={styles.mention}>{tf("provenance")} · <a href={source} target="_blank" rel="noopener noreferrer">{tf("source")} ↗</a></p>
          </section>
        </>
      )}

      <p className={rapport.barreThematique}>
        <IconeTheme icone="livre" className={rapport.pictoBarre} />
        <span><strong>{tRapport("navigationThematique.titre")}</strong> : {tRapport("navigationThematique.texte")}</span>
        <Link href="/themes" aria-label={tRapport("navigationThematique.titre")}>↗</Link>
      </p>
      <p className={styles.mention}>{tr("avertissement")}</p>
    </main>
  );
}
