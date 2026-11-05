import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import GestionContenus from "@/composants/GestionContenus";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Administration · Contenus — Milaghaiba" };

export default async function PageGestionContenus({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <main id="contenu" tabIndex={-1}><GestionContenus locale={locale} /></main>;
}
