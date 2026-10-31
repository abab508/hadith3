import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { extraitsMemorisation } from "@/donnees/memorisation";
import AtelierMemoire from "@/composants/AtelierMemoire";

export async function generateMetadata({params}: {params: Promise<{locale:string}>}): Promise<Metadata> {
  const {locale}=await params;
  const t=await getTranslations({locale,namespace:"memorisation"});
  return {title:t("titre"),description:t("intro")};
}

export default async function PageMemorisation({params}: {params: Promise<{locale:string}>}) {
  const {locale}=await params;
  setRequestLocale(locale);
  return (
    <main id="contenu" tabIndex={-1}>
      <AtelierMemoire extraits={extraitsMemorisation()} />
    </main>
  );
}
