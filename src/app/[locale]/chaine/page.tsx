import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { corpus, hadithParId } from "@/donnees/corpus";
import RechercheChaine from "@/composants/RechercheChaine";
import ui from "@/composants/Interface.module.css";
import styles from "./Chaine.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chaine" });
  return { title: t("titre") };
}

export default async function Chaine({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hadith?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chaine");
  const brut = (await searchParams).hadith;
  const demande = Array.isArray(brut) ? brut[0] : brut;
  const hadith = (demande && hadithParId(demande)) || corpus.hadiths[0];

  return (
    <main id="contenu" tabIndex={-1} className={ui.page}>
      <div className={styles.intro}>
        <h1 className={styles.titre}>{t("titre")}</h1>
        <p>{t("intro")}</p>
      </div>
      {hadith ? <RechercheChaine hadithInitial={hadith.id} /> : <p>{t("hadithManquant")}</p>}
    </main>
  );
}
