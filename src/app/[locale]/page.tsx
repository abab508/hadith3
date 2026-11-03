import {setRequestLocale} from "next-intl/server";
import VueCatalogue from "@/composants/VueCatalogue";
import ControleCinema from "@/composants/ControleCinema";
import {langueThemes} from "@/donnees/themes";
import styles from "./AccueilCinema.module.css";

/** Accueil uniquement : les autres routes et les sources restent intactes. */
export default async function Accueil({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 setRequestLocale(locale);
 return (
  <main id="contenu" tabIndex={-1} className={styles.accueilCinema}>
   <VueCatalogue locale={locale}/>
   <div className={styles.commandes}>
    <ControleCinema langue={langueThemes(locale)}/>
   </div>
  </main>
 );
}
