import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import VueCatalogue from "@/composants/VueCatalogue";
import styles from "./Themes.module.css";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;
 return {title:locale==="ar"?"الأبواب الكبرى في الإسلام":locale==="en"?"Major chapters of Islam":"Les grands chapitres de l’islam"};
}
export default async function Themes({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;setRequestLocale(locale);
 return <main id="contenu" tabIndex={-1} className={styles.page}><VueCatalogue locale={locale}/></main>;
}
