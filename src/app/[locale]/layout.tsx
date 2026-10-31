import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { entree } from "@/donnees/catalogue";
import { clesManquantes } from "@/i18n/charger";
import { routing } from "@/i18n/routing";
import EnTete from "@/composants/EnTete";
import "@/styles/polices.css";
import "@/styles/global.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accueil" });
  return { title: t("titre"), description: t("sousTitre") };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const langue = entree(locale);
  if (!hasLocale(routing.locales, locale) || !langue) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations("commun");
  const repli = (await clesManquantes(locale)).length > 0;

  // Police de la langue, ses secours, puis Noto Sans pour les passages latins.
  const polices = [langue.police.famille, ...(langue.police.secours ?? []), "Noto Sans"].map((p) => `"${p}"`);

  return (
    <html lang={locale} dir={langue.direction} data-theme="auto" data-motion="on">
      <body style={{ "--police": [...new Set(polices), "system-ui", "sans-serif"].join(", ") } as CSSProperties}>
        <a className="evitement" href="#contenu">{t("allerAuContenu")}</a>
        {repli && (
          <p className="repli" role="status">
            {t("repliSignale")}
          </p>
        )}
        <NextIntlClientProvider>
          <EnTete />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
