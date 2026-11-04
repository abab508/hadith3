import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import IndexAZ from "@/composants/IndexAZ";
import { entree } from "@/donnees/catalogue";
import { alphabetArabe, alphabetLatin, lettreIndex, sansArticle, type EntreeIndex } from "@/donnees/index-az";
import { catalogueRecueils } from "@/donnees/recueils";
import { chapitres, themes } from "@/donnees/themes";
import { clesChapitres, clesThemes } from "@/donnees/cles-themes";
import styles from "@/composants/Pages.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "az" });
  return { title: t("titre"), description: t("sousTitre") };
}

export default async function PageIndexAZ({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("az");
  const tt = await getTranslations("themes");
  const tc = await getTranslations("chapitres");
  // Interface en écriture arabe (direction rtl) : index par lettres arabes, recueils par leur nom arabe.
  const arabe = entree(locale)?.direction === "rtl";
  const alphabet = arabe ? alphabetArabe : alphabetLatin;

  const brutes: Omit<EntreeIndex, "lettre" | "tri">[] = [
    ...themes.map((th) => ({ titre: tt(clesThemes[th.cle].titre), type: "theme" as const, href: `/themes/${th.id}` })),
    ...chapitres.map((c) => ({ titre: tc(clesChapitres[c.cle].titre), type: "chapitre" as const, href: `/chapitres/${c.id}` })),
    ...catalogueRecueils.recueils.map((r) => ({ titre: arabe ? r.nomAr : r.nom, type: "recueil" as const, href: `/bibliotheque?q=${encodeURIComponent(r.nom)}` })),
  ];
  const entrees: EntreeIndex[] = brutes.flatMap((e) => {
    const lettre = lettreIndex(e.titre, alphabet);
    return lettre ? [{ ...e, lettre, tri: sansArticle(e.titre) }] : [];
  });

  return (
    <main id="contenu" tabIndex={-1} className={styles.pageIndex}>
      <section className={styles.colonneIndex} aria-labelledby="titre-index">
        <h1 id="titre-index" className={styles.titreSection}>{t("titre")}</h1>
        <p className={styles.sousTitreIndex}>{t("sousTitre")}</p>
        <IndexAZ
          alphabet={alphabet}
          entrees={entrees}
          libelles={{ lettres: t("lettres"), rechercher: t("rechercher"), aucun: t("aucun"), toutes: t("toutes"), theme: t("theme"), chapitre: t("chapitre"), recueil: t("recueil") }}
        />
      </section>
      <div className={styles.salle} aria-hidden="true">
        <img src="/images/maquette/salle.jpg" alt="" />
        <span className={styles.lueurSalle} />
      </div>
    </main>
  );
}
