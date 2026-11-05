import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GestionContenus from "@/composants/GestionContenus";
import { entree } from "@/donnees/catalogue";
import { nomLangueTraduit } from "@/donnees/langues-affichage";
import { languesContenu } from "@/lib/contenus/depot";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminContenus" });
  return { robots: { index: false, follow: false }, title: `${t("metaTitre")} — Milaghaiba` };
}

export default async function PageGestionContenus({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Langues d'écriture : toutes celles du catalogue, nommées dans la langue de l'interface.
  const langues = languesContenu().map((tag) => ({ tag, nom: nomLangueTraduit(entree(tag)!, locale) }));
  return <main id="contenu" tabIndex={-1}><GestionContenus locale={locale} langues={langues} /></main>;
}
