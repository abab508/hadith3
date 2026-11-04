import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { corpus, hadithParId } from "@/donnees/corpus";
import { chercher } from "@/donnees/recherche";
import { chercherNoticesImportees } from "@/donnees/index-imports";
import { remoteSearch } from "@/donnees/recherche-distante";
import { langueIndex } from "@/composants/ResultatsRecueils";
import type { RecitImporte } from "@/composants/RechercheChaine";
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
  searchParams: Promise<{ hadith?: string | string[]; q?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chaine");
  const parametres = await searchParams;
  const premier = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const demande = premier(parametres.hadith);
  // Recherche du hadith par mot (arabe, avec ou sans voyelles, ou traduction) ou par numéro : moteur de la page Recherche.
  const requete = (premier(parametres.q) ?? "").trim().slice(0, 200);
  const trouves = requete ? chercher(requete).map((h) => h.id) : [];
  // Toute la base : les récits importés (texte arabe seul, chaîne non analysée) sont proposés aussi.
  const importes = requete ? chercherNoticesImportees(requete, undefined, 1, 12) : { total: 0, items: [] };
  // Grands recueils (index public hadith-api, français ou arabe) : seul le hadith affiché est téléchargé.
  const recueils = requete ? await remoteSearch(requete, undefined, langueIndex(requete), 1, 12) : { total: 0, items: [] };
  const recitsRecueils: RecitImporte[] = recueils.items.map((h) => ({
    id: h.id, recueilAr: "", recueilLatin: h.nom, numero: String(h.numero),
    extrait: h.texte.length > 160 ? `${h.texte.slice(0, 160)}…` : h.texte, source: h.sourceUrl,
    lien: `/hadith/${h.recueil}/${h.langue}/${h.numero}`, langue: h.langue === "ara" ? "ar" : "fr",
  }));
  const recits: RecitImporte[] = importes.items.map((n) => ({
    id: n.id, recueilAr: n.recueilAr, recueilLatin: n.recueilLatin, numero: n.numero,
    extrait: n.texteAr.length > 160 ? `${n.texteAr.slice(0, 160)}…` : n.texteAr, source: n.fichierSource,
  }));
  const hadith = (demande && hadithParId(demande)) || (trouves[0] && hadithParId(trouves[0])) || corpus.hadiths[0];

  return (
    <main id="contenu" tabIndex={-1} className={ui.page}>
      <div className={styles.intro}>
        <h1 className={styles.titre}>{t("titre")}</h1>
        <p>{t("introCourte")}</p>
      </div>
      {hadith ? <RechercheChaine hadithInitial={hadith.id} requete={requete} trouves={requete ? trouves : null} recits={[...recitsRecueils, ...recits]} totalRecits={recueils.total + importes.total} /> : <p>{t("hadithManquant")}</p>}
    </main>
  );
}
