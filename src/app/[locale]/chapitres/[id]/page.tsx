import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Onglets from "@/composants/Onglets";
import ImageDecorative from "@/composants/ImageDecorative";
import IllustrationChapitre from "@/composants/IllustrationChapitre";
import PresentationChapitre from "@/composants/PresentationChapitre";
import { chapitreParId, themeParId } from "@/donnees/themes";
import { clesChapitres, clesThemes } from "@/donnees/cles-themes";
import { chapitreKg, chapitresDuThemeKg, motifsDe, repartitionParRecueil, titreKg } from "@/donnees/chapitres-kg";
import { nomRecueil } from "@/donnees/noms-recueils";
import styles from "@/composants/Pages.module.css";
import liste from "@/app/[locale]/recueil/[id]/Recueil.module.css";

type Parametres = { locale: string; id: string };

// Titre d'un chapitre : libellé d'interface pour les 5 chapitres de la maquette, sinon titre de la source.
async function titreChapitre(id: string, locale: string) {
  const fixe = chapitreParId(id);
  if (fixe) {
    const tc = await getTranslations({ locale, namespace: "chapitres" });
    const cles = clesChapitres[fixe.cle];
    return { texte: tc(cles.titre), langue: locale, sousTitre: cles.sousTitre ? tc(cles.sousTitre) : null };
  }
  const c = chapitreKg(id);
  return c ? { ...titreKg(c, locale), sousTitre: null } : null;
}

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await titreChapitre(id, locale);
  return t ? { title: t.texte } : {};
}

export default async function PageChapitre({ params }: { params: Promise<Parametres> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const c = chapitreKg(id);
  const theme = c ? themeParId(c.theme) : undefined;
  const titre = await titreChapitre(id, locale);
  if (!c || !theme || !titre) notFound();
  const fixe = chapitreParId(id);
  const t = await getTranslations("chapitre");
  const tk = await getTranslations("chapitreKg");
  const tc = await getTranslations("chapitres");
  const tt = await getTranslations("themes");
  const nav = await getTranslations("navigation");
  const numero = chapitresDuThemeKg(theme.id).findIndex((x) => x.id === id) + 1;
  const titreTheme = tt(clesThemes[theme.cle].titre);
  const motifs = motifsDe(c.fr ?? c.ar, c.theme);
  const repartition = await repartitionParRecueil(id);
  const cleIntro = fixe ? clesChapitres[fixe.cle].intro : null;
  const intro = cleIntro ? tc(cleIntro) : null;
  const sousTitres = c.sous.map((s) => titreKg(s, locale));
  const dessiner = (instance: string) => motifs.map((m, i) => (
    <IllustrationChapitre key={m} motif={m} second={motifs[(i + 1) % motifs.length]} graine={`${id}-${i}`} instance={instance} titre={`${titre.texte} — ${tk("illustration", { n: i + 1 })}`} />
  ));
  const illustrations = dessiner("g");

  return (
    <main id="contenu" tabIndex={-1} className={styles.pageChapitre}>
      <ImageDecorative className={styles.fondChapitre} src="/images/hd/chapitre-fond.png" sizes="100vw" />
      <div className={styles.grilleChapitre}>
        <div className={styles.colonnePrincipale}>
          <ol className={styles.filAriane} aria-label={t("fil")}>
            <li><Link href="/">{nav("accueil")}</Link></li>
            <li><Link href={`/themes/${theme.id}`}>{titreTheme}</Link></li>
            <li aria-current="page">{numero}. <bdi lang={titre.langue}>{titre.texte}</bdi></li>
          </ol>
          <p className={styles.surtitreChapitre}>{tt("chapitre", { n: numero })}</p>
          <h1 className={styles.titreChapitre}><bdi lang={titre.langue} dir="auto">{titre.texte}</bdi></h1>
          {titre.sousTitre ? <p className={styles.sousTitreChapitre} dir="auto">({titre.sousTitre})</p>
            : titre.langue !== "ar" ? <p className={`${styles.sousTitreChapitre} ${styles.arabeSousTitre} texte-arabe`} lang="ar" dir="rtl">{c.ar}</p> : null}
          <Onglets
            titre={t("onglets")}
            onglets={[
              {
                cle: "introduction",
                libelle: t("introduction"),
                contenu: (
                  <section className={styles.introChapitre} aria-labelledby="titre-intro">
                    <span className={styles.medaillon} aria-hidden="true">۞</span>
                    <div>
                      <h2 id="titre-intro">{t("introduction")}</h2>
                      {intro && <p>{intro}</p>}
                      <p>{tk("compte", { nombre: c.nombre, sous: c.sous.length })}</p>
                      <div className={styles.galerieChapitre}>
                        {fixe ? <span className={styles.cadreGalerie}><ImageDecorative src={`/images/hd/${fixe.image}.png`} sizes="(max-width: 900px) 100vw, 30rem" /></span> : null}
                        {illustrations}
                      </div>
                      <p className={styles.mention}>{tk("sourceTitres")}</p>
                    </div>
                  </section>
                ),
              },
              {
                cle: "hadiths",
                libelle: t("hadiths"),
                contenu: (
                  <ol className={liste.liste}>
                    {c.sous.map((s, i) => (
                      <li key={s.id}>
                        <Link href={`/chapitres/${id}/${s.id}`} className={liste.entree}>
                          <span className={liste.numero}>{i + 1}.</span>
                          <span className={liste.corps}>
                            <bdi lang={sousTitres[i]!.langue} dir="auto" className={liste.titreSous}>{sousTitres[i]!.texte}</bdi>
                            {sousTitres[i]!.langue !== "ar" && <bdi lang="ar" dir="rtl" className={`texte-arabe ${liste.marque}`}>{s.ar}</bdi>}
                            <span className={liste.marque}>{tk("nbHadiths", { count: s.nombre })}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/chapitres/${id}/autres`} className={liste.entree}>
                        <span className={liste.numero}>+</span>
                        <span className={liste.corps}><span className={liste.titreSous}>{c.sous.length > 0 ? tk("autres") : tk("tousLesHadiths")}</span></span>
                      </Link>
                    </li>
                  </ol>
                ),
              },
              { cle: "explications", libelle: t("explications"), contenu: <p className={styles.mentionListe}>{tk("explications")}</p> },
              {
                cle: "references",
                libelle: t("references"),
                contenu: (
                  <div>
                    <p>{tk("referencesIntro")}</p>
                    <ul className={styles.listeReferences}>
                      {repartition.map((r) => (
                        <li key={`${r.type}-${r.recueil}`}>
                          <Link href={r.type === "h" ? `/recherche?recueil=${r.recueil}` : `/recueil/${r.recueil}`}><bdi>{nomRecueil(r.type, r.recueil)}</bdi></Link>
                          <span className={styles.mention}>{tk("nbHadiths", { count: r.nombre })}</span>
                        </li>
                      ))}
                    </ul>
                    <p className={styles.mention}>{tk("source")}</p>
                  </div>
                ),
              },
              {
                cle: "audio",
                libelle: t("audio"),
                contenu: (
                  <PresentationChapitre
                    diapos={dessiner("d")}
                    lignes={[titre.texte, ...sousTitres.slice(0, 12).map((s) => s.texte)]}
                    langue={titre.langue}
                    libelles={{ lancer: tk("lancer"), pause: tk("pause"), ecouter: tk("ecouter"), arreter: tk("arreter"), voix: tk("voix"), sansVoix: tk("sansVoix"), diapo: tk("diapo") }}
                  />
                ),
              },
            ]}
          />
        </div>
        <aside className={styles.panneauHadiths} aria-labelledby="titre-hadiths">
          <h2 id="titre-hadiths">{t("hadithsDuChapitre")}</h2>
          <div className={styles.illustrationPanneau}>{dessiner("p")[0]}</div>
          <ol className={styles.listeSousPanneau}>
            {c.sous.slice(0, 8).map((s, i) => (
              <li key={s.id}><span className={styles.numeroHadith}>{i + 1}.</span> <Link href={`/chapitres/${id}/${s.id}`}><bdi lang={sousTitres[i]!.langue} dir="auto">{sousTitres[i]!.texte}</bdi></Link></li>
            ))}
          </ol>
          <p className={styles.mention}>{tk("compte", { nombre: c.nombre, sous: c.sous.length })}</p>
        </aside>
      </div>
    </main>
  );
}
