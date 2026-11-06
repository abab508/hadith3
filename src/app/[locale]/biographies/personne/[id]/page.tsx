import EntetePatrimoine from "@/composants/EntetePatrimoine";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { aUneFiche, ficheBio, serieDe, type Voisin } from "@/donnees/biographies";
import { catalogueRecueils } from "@/donnees/recueils";
import { ecritLatin, translitererLieux, translitererNom } from "@/donnees/translitteration";
import styles from "../../Biographies.module.css";
import { CLES_SERIES } from "@/donnees/cles-interface";
import { traduireJugement } from "@/donnees/jugements-traduits";
import { videoDe } from "@/donnees/videos";
import { entree } from "@/donnees/catalogue";

type Parametres = { locale: string; id: string };
const lireId = (id: string) => (/^\d{1,6}$/.test(id) ? Number(id) : NaN);

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { id } = await params;
  const f = await ficheBio(lireId(id));
  return { title: f ? (f.kunya ?? f.nom) : "Biographie" };
}

// Fiche d'une personne : uniquement les champs de la source, les jugements cités tels quels,
// et les maîtres / élèves déduits des chaînes de la source.
export default async function PagePersonne({ params }: { params: Promise<Parametres> }) {
  const { locale, id } = await params;
  const n = lireId(id);
  const f = await ficheBio(n);
  if (!f) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("biographies");
  const tr = await getTranslations("rapportTexte");
  const serie = serieDe(n);
  const video = videoDe(n);
  const latin = ecritLatin(locale);
  const usage = f.kunya ?? f.nom;
  const translit = latin ? translitererNom(usage) : undefined;
  const lieu = (texte?: string) => texte && (
    <>
      <bdi lang="ar" dir="rtl" className="texte-arabe">{texte}</bdi>
      {latin && translitererLieux(texte) && <> · <bdi lang="ar-Latn">{translitererLieux(texte)}</bdi></>}
    </>
  );

  const reperes: [string, React.ReactNode][] = [];
  if (f.kunya && f.kunya !== f.nom) reperes.push([tr("nomComplet"), <bdi key="n" lang="ar" dir="rtl" className="texte-arabe">{f.nom}</bdi>]);
  if (f.tabaqa) reperes.push([tr("tabaqa"), t("generation", { n: f.tabaqa })]);
  if (f.naissance) reperes.push([tr("naissance"), tr("annee", { annee: f.naissance })]);
  if (f.deces) reperes.push([tr("deces"), tr("annee", { annee: f.deces })]);
  if (f.age) reperes.push([t("age"), f.age]);
  if (f.lieuDeces) reperes.push([tr("lieuDeces"), lieu(f.lieuDeces)]);
  if (f.residence) reperes.push([tr("residence"), lieu(f.residence)]);
  if (f.nasab) reperes.push([tr("nasab"), <bdi key="s" lang="ar" dir="rtl" className="texte-arabe">{f.nasab.replaceAll("،", "، ")}</bdi>]);
  if (f.metier) reperes.push([t("metier"), <bdi key="m" lang="ar" dir="rtl" className="texte-arabe">{f.metier}</bdi>]);
  const rangTraduit = traduireJugement(f.rang, locale);
  if (f.rang) reperes.push([tr("synthese"), <span key="r">{rangTraduit && <bdi lang={locale}>{rangTraduit} · </bdi>}<bdi lang="ar" dir="rtl" className="texte-arabe">{f.rang}</bdi></span>]);
  if (f.riwayat) reperes.push([tr("riwayat"), t("recits", { n: f.riwayat })]);
  if (f.tadlis) reperes.push(["", tr("tadlis")]);
  if (f.ikhtilat) reperes.push(["", tr("ikhtilat")]);

  const voisins = (titre: string, cle: string, liste: Voisin[]) => liste.length > 0 && (
    <section className={styles.cadre} aria-labelledby={`titre-${cle}`}>
      <h2 id={`titre-${cle}`} className={styles.titreBloc}>{titre}</h2>
      <ul className={styles.voisins} data-voisins={cle}>
        {liste.map(([vid, nom, nb]) => (
          <li key={vid}>
            {aUneFiche(vid)
              ? <Link href={`/biographies/personne/${vid}`}><bdi lang="ar" dir="rtl" className="texte-arabe">{nom}</bdi></Link>
              : <bdi lang="ar" dir="rtl" className="texte-arabe">{nom}</bdi>}
            <span className={styles.nombre}>{t("chaines", { n: nb })}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}>
        {serie ? <Link href={`/biographies/${serie}`}>← {t(CLES_SERIES[serie].titre)}</Link> : <Link href="/biographies">← {t("retour")}</Link>}
      </p>
      <EntetePatrimoine scene="biographies" compacte className={styles.entete}>
        <p className={styles.surtitre}>{serie ? t(CLES_SERIES[serie].titre) : t("titre")}</p>
        <h1 className={styles.titre}><bdi lang="ar" dir="rtl" className="texte-arabe">{usage}</bdi></h1>
        {translit && <p className={styles.nomLatin} lang="ar-Latn">{translit}</p>}
      </EntetePatrimoine>

      <div className={styles.fiche}>
        <div className={styles.colonne}>
          <section className={styles.cadre} aria-labelledby="titre-reperes">
            <h2 id="titre-reperes" className={styles.titreBloc}>{t("reperes")}</h2>
            <dl className={styles.reperes}>
              {reperes.map(([cle, valeur], i) => (
                <div key={i} className={styles.ligne}><dt>{cle}</dt><dd>{valeur}</dd></div>
              ))}
            </dl>
          </section>
          {f.recueils && f.recueils.length > 0 && (
            <section className={styles.cadre} aria-labelledby="titre-recueils">
              <h2 id="titre-recueils" className={styles.titreBloc}>{t("recueils")}</h2>
              <ul className={styles.puces}>
                {f.recueils.map((r) => (
                  <li key={r}><Link href={`/recueil/${r}`}><bdi lang="ar-Latn">{catalogueRecueils.recueils.find((x) => x.id === r)?.nom ?? r}</bdi></Link></li>
                ))}
              </ul>
            </section>
          )}
          <section className={styles.cadre} aria-labelledby="titre-jugements">
            <h2 id="titre-jugements" className={styles.titreBloc}>{t("jugements")}</h2>
            {f.jugements && f.jugements.length > 0 ? (
              <ul className={styles.jugements}>
                {f.jugements.map(([critique, texte], i) => (
                  <li key={i}>
                    <p lang="ar" dir="rtl" className="texte-arabe"><span className={styles.critique}>{critique}</span>{texte}</p>
                    {traduireJugement(texte, locale) && <p lang={locale}>{traduireJugement(texte, locale)}</p>}
                  </li>
                ))}
              </ul>
            ) : <p>{tr("aucunJugementKg")}</p>}
          </section>
        </div>
        <div className={styles.colonne}>
          {video && (
            <section className={styles.cadre} aria-labelledby="titre-video" data-video={video.id}>
              <h2 id="titre-video" className={styles.titreBloc}>{t("video.titre")}</h2>
              {/* Jamais de lecture automatique ; « metadata » ne charge que la durée (quelques Ko). */}
              <video className={styles.video} controls preload="metadata" playsInline poster={video.affiche}
                width={video.largeur} height={video.hauteur} aria-labelledby="titre-video" aria-describedby="description-video">
                <source src={video.fichier} type="video/mp4" />
                {t.rich("video.repli", { lien: (morceau) => <a href={video.fichier}>{morceau}</a> })}
              </video>
              <p id="description-video" className={styles.mention}>{t("video.description")}</p>
              <details className={styles.texteVideo}>
                <summary>{t("video.texte")}</summary>
                <ol className={styles.lignesVideo}>
                  {video.texte.map((ligne, i) => (
                    <li key={i}>
                      <p lang="ar" dir={entree("ar")?.direction} className="texte-arabe">{ligne.ar}</p>
                      <p lang={video.sousTitres} dir={entree(video.sousTitres)?.direction}>{ligne.sousTitre}</p>
                    </li>
                  ))}
                </ol>
              </details>
            </section>
          )}
          {voisins(t("maitres"), "maitres", f.maitres)}
          {voisins(t("eleves"), "eleves", f.eleves)}
          {(f.maitres.length > 0 || f.eleves.length > 0) && <p className={styles.mention}>{t("voisinsAide")}</p>}
        </div>
      </div>
      {latin && translit && <p className={styles.mention}>{tr("translitteration")}</p>}
      <p className={styles.mention}>{t("avertissement")}</p>
      <p className={styles.mention}>{t("source")}</p>
    </main>
  );
}
