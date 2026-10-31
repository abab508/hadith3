import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ImportStudio from "@/composants/ImportStudio";
export const metadata:Metadata={robots:{index:false,follow:false},title:"Administration · Import CSV — Milaghaiba"};
export default async function AdminImportPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  setRequestLocale(locale);
  return <main id="contenu" tabIndex={-1}><ImportStudio lang={locale}/></main>;
}
