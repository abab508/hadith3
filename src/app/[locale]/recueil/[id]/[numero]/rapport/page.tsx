import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { catalogueRecueils } from "@/donnees/recueils";
import { categorieDepuisRang, type MaillonKg } from "@/donnees/fiches-kg";
import { hadithKg, maillonsKg, validerRecueil, type HadithKg } from "@/donnees/recueils-kg";
import { extraireChaine } from "@/donnees/isnad-texte";
import { avecLatin } from "@/donnees/translitteration";
import Embleme from "@/composants/Embleme";
import ChaineTexteRapport from "@/composants/ChaineTexteRapport";
import ui from "@/composants/Interface.module.css";
import rapport from "@/app/[locale]/rapport/[id]/Rapport.module.css";
import chaineStyles from "@/composants/ChaineRapport.module.css";
import styles from "@/app/[locale]/hadith/[recueil]/[langue]/[numero]/Hadith.module.css";
import liste from "../../Recueil.module.css";

type Parametres = { locale: string; id: string; numero: string };

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { id, numero } = await params;
  const r = catalogueRecueils.recueils.find((x) => x.id === id);
  return { title: r ? `${r.nom} · n° ${numero} · isnād` : "Hadith", robots: { index: false, follow: true } };
}

// Rapport d'un hadith d'un recueil de la bibliothèque : chaîne(s) et fiches des transmetteurs de hadith-kg.
export default async function RapportRecueil({ params, searchParams }: { params: Promise<Parametres>; searchParams: Promise<{ chaine?: string }> }) {
  const { locale, id, numero } = await params;
  const { chaine: choixChaine } = await searchParams;
  setRequestLocale(locale);
  const valide = validerRecueil(id, numero);
  const fiche = catalogueRecueils.recueils.find((x) => x.id === id);
  if (!valide?.n || !fiche) notFound();
  const { recueil, n } = valide;
  const t = await getTranslations("recueilKg");
  const tt = await getTranslations("rapportTexte");
  const tRapport = await getTranslations("rapport");
  const tAccueil = await getTranslations("accueil");
  const tEntete = await getTranslations("entete");

  let hadith: HadithKg | null = null;
  let maillons: MaillonKg[] | null = null;
  let echec = false;
  const chaines = (h: HadithKg | null) => h?.chaines ?? [];
  let k = 0;
  try {
    hadith = await hadithKg(recueil, n);
    k = Math.min(Math.max(0, (Number.parseInt(choixChaine ?? "1", 10) || 1) - 1), Math.max(0, chaines(hadith).length - 1));
    const ch = chaines(hadith)[k];
    const brutes = ch ? await maillonsKg(ch, recueil.auteur) : null;
    if (brutes) maillons = avecLatin(brutes, locale);
  } catch { echec = true; }
  const texte = hadith?.texte ?? "";
  const mentionProphete = /(رسول الله|النبي)/u.test(texte.normalize("NFC").replace(/[ً-ٰٟـ]/gu, ""));
  const decoupe = texte ? extraireChaine(texte) : { maillons: [], jusquAuProphete: false };
  const hukm = hadith?.hukm?.[k];

  return (
    <main id="contenu" tabIndex={-1} className={`${ui.page} ${rapport.pageRapport}`}>
      <section className={rapport.banniere} aria-label={tRapport("banniere.titre")}>
        <img className={rapport.imageBanniere} src="/images/maquette/accueil.jpg" alt="" />
        <span className={rapport.voileBanniere} aria-hidden="true" />
        <Embleme nomLatin={tAccueil("titre")} nomArabe={tEntete("nomArabe")} mention={tRapport("banniere.surtitre")} />
        <p className={rapport.grandTitre}>{tRapport("banniere.titre")}</p>
        <p className={rapport.texteBanniere}>{tRapport("banniere.texte")}</p>
      </section>

      <p className={styles.retour}><Link href={`/recueil/${id}/${n}`}>← {tt("retourHadith")}</Link></p>
      <div className={styles.entete}>
        <h1 className={styles.titre}><bdi lang="ar-Latn">{fiche.nom}</bdi></h1>
        <p className={styles.reference}><bdi dir="ltr">{t("numero", { n })}</bdi>{hadith ? <> · {t("refSource", { ref: hadith.ref })}</> : null}</p>
      </div>

      {echec || !hadith ? (
        <section className={`${ui.carte} ${chaineStyles.cadreOr}`} role="status"><p>{echec ? t("indisponible") : t("introuvable")}</p></section>
      ) : (
        <>
          {chaines(hadith).length > 1 && (
            <section className={`${ui.carte} ${chaineStyles.cadreOr}`} aria-labelledby="titre-chaines">
              <h2 id="titre-chaines" className={styles.titreBloc}>{t("chaines", { count: chaines(hadith).length })}</h2>
              <ul className={liste.selecteur}>
                {chaines(hadith).map((_, i) => (
                  <li key={i}><Link href={`/recueil/${id}/${n}/rapport?chaine=${i + 1}`} aria-current={i === k ? "true" : undefined}>{t("chaineN", { k: i + 1 })}</Link></li>
                ))}
              </ul>
            </section>
          )}
          {maillons
            ? <ChaineTexteRapport key={k} fiches={maillons} categories={maillons.map(categorieDepuisRang)} recueil={fiche.nom} jusquAuProphete={mentionProphete} guide={t("guide")} />
            : decoupe.maillons.length > 0
            ? <ChaineTexteRapport maillons={decoupe.maillons} recueil={fiche.nom} jusquAuProphete={decoupe.jusquAuProphete} />
            : <section className={`${ui.carte} ${chaineStyles.cadreOr}`}><p>{tt("pasDeChaine")}</p></section>}
          {hukm && (
            <section className={`${ui.carte} ${chaineStyles.cadreOr}`} aria-labelledby="titre-hukm">
              <h2 id="titre-hukm" className={styles.titreBloc}>{t("hukm")}</h2>
              <p lang="ar" dir="rtl" className="texte-arabe">{hukm}</p>
              <p className={styles.mention}>{t("hukmAide")}</p>
            </section>
          )}
          <section className={`${ui.carte} ${chaineStyles.cadreOr}`} aria-labelledby="titre-texte-complet">
            <h2 id="titre-texte-complet" className={styles.titreBloc}>{tt("texteComplet")}</h2>
            <p lang="ar" dir="rtl" className={`texte-arabe ${styles.arabe}`}>{texte}</p>
          </section>
        </>
      )}
      <p className={styles.mention}>{t("source")}</p>
    </main>
  );
}
