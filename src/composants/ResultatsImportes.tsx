import { getTranslations } from "next-intl/server";
import { chercherNoticesImportees } from "@/donnees/index-imports";
import { Link } from "@/i18n/navigation";
import styles from "./ResultatsImportes.module.css";

export default async function ResultatsImportes({
  locale,saisie,recueil,page,recherche,
}:{
  locale:string;saisie:string;recueil?:string;page:number;recherche:string;
}) {
  const t=await getTranslations({locale,namespace:"recherche"});
  const donnee=chercherNoticesImportees(saisie,recueil,page);
  function urlPage(n:number){
    const params=new URLSearchParams(recherche);
    params.set("pageImport",String(n));
    return "/recherche?"+params.toString();
  }
  return (
    <section className={styles.section} aria-labelledby="titre-recherche-importee">
      <div className={styles.entete}>
        <div>
          <p className={styles.surtitre}>◈ {t("indexBadge")}</p>
          <h2 id="titre-recherche-importee">{t("indexTitre")}</h2>
          <p>{t("indexIntro")}</p>
        </div>
        <span className={styles.chiffre} role="status">
          {t("indexNombre",{nombre:donnee.total})}
        </span>
      </div>
      {donnee.items.length===0?(
        <p className={styles.vide}>{t("indexVide")}</p>
      ):(
        <ol className={styles.grille}>
          {donnee.items.map(h=>(
            <li key={h.id} className={styles.carte}>
              <div className={styles.carteTop}>
                <p lang="ar" dir="rtl" className="texte-arabe">{h.recueilAr}</p>
                <span className={styles.numero}>№ <bdi dir="ltr">{h.numero}</bdi></span>
              </div>
              <p className={styles.sousMeta}>{t("indexLivre",{numero:h.livreNumero})}</p>
              <p className={styles.extrait} lang="ar" dir="rtl">{h.texteAr.slice(0,225)}{h.texteAr.length>225?"…":""}</p>
              <details className={styles.complet}>
                <summary>{t("indexOuvrir")}</summary>
                <p lang="ar" dir="rtl" className="texte-arabe">{h.texteAr}</p>
              </details>
              <p className={styles.incertain}>{t("indexSansIsnad")}</p>
              <div className={styles.bas}>
                <span>{t("indexSource")}</span>
                <a href={h.fichierSource} target="_blank" rel="noopener noreferrer">
                  {t("indexVoirSource")} ↗
                </a>
              </div>
            </li>
          ))}
        </ol>
      )}
      {donnee.pageTotal>1&&(
        <nav className={styles.pagination} aria-label={t("pagination")}>
          {donnee.page>1&&<Link href={urlPage(donnee.page-1)}>{t("precedent")}</Link>}
          <span>{t("pageCompte",{page:donnee.page,total:donnee.pageTotal})}</span>
          {donnee.page<donnee.pageTotal&&<Link href={urlPage(donnee.page+1)}>{t("suivant")}</Link>}
        </nav>
      )}
      <p className={styles.avertissement}>{t("indexAvertissement")}</p>
    </section>
  );
}
