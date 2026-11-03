import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import Terme from "@/composants/Terme";
import SelecteurRecueil from "@/composants/SelecteurRecueil";
import { livresParCategorie, recueils } from "@/donnees/recherche";
import { bibliothequeParId } from "@/donnees/corpus";
import { Link } from "@/i18n/navigation";
import ui from "@/composants/Interface.module.css";
import styles from "@/app/[locale]/Accueil.module.css";

const modes = [
  { valeur: "approximative", libelle: "accueil.modes.approximative" },
  { valeur: "exacte", libelle: "accueil.modes.exacte" },
  { valeur: "fragment", libelle: "accueil.modes.fragment" },
  { valeur: "traduction", libelle: "accueil.modes.traduction" },
  { valeur: "translitteration", libelle: "accueil.modes.translitteration" },
  { valeur: "reference", libelle: "accueil.modes.reference" },
  { valeur: "transmetteur", libelle: "accueil.modes.transmetteur" },
  { valeur: "collection", libelle: "accueil.modes.collection" },
] as const;

const sources = [
  { cle: "ouverts", badge: "accueil.sources.ouverts.badge", titre: "accueil.sources.ouverts.titre", texte: "accueil.sources.ouverts.texte", ton: "accent" },
  { cle: "reserves", badge: "accueil.sources.reserves.badge", titre: "accueil.sources.reserves.titre", texte: "accueil.sources.reserves.texte", ton: undefined },
] as const;

export default function Accueil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();
  const shamila = bibliothequeParId("shamila");

  return (
    <main id="contenu" tabIndex={-1} className={styles.accueil}>
      <section className={styles.hero} aria-labelledby="titre-accueil">
        <h1 id="titre-accueil" className={styles.titre}>{t("accueil.titre")}</h1>
        <p className={styles.titreComplet}>
          {locale !== "ar" && <bdi lang="ar" dir="rtl" className={styles.nomArabe}>الملة الغائبة</bdi>}
          <bdi lang="ar-Latn" dir="ltr" className={styles.nomPhonetique}>Al-milla al-gha'iba</bdi>
        </p>
        <p className={styles.sousTitre}>{t("accueil.sousTitre")}</p>
        <span className={styles.heroDivider} aria-hidden="true" />
        <p className={`${ui.badge} ${styles.etat}`} data-ton="ocre">{t("accueil.etat")}</p>
        <p className={styles.terme}>
          {t("accueil.exempleTerme")} <Terme id="hasan" />
        </p>
        <div className={styles.heroActions}>
          <Link href="/memorisation" className={styles.heroCTA}>
            <span aria-hidden="true">✧</span> {t("navigation.memorisation")} <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/glossaire" className={styles.heroSecondary}>{t("accueil.glossaire")} <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section aria-label={locale === "ar" ? "التصنيف الموضوعي" : "Hadiths par thèmes"} style={{padding:"1.5rem",border:"1px solid var(--bordure)",borderRadius:"1.5rem",background:"linear-gradient(120deg,#20392d,#15251e)",color:"#fff3d8",boxShadow:"0 16px 40px #02080755"}}>
        <span style={{fontSize:".85rem",letterSpacing:".08em",color:"#f1c98b"}}>✦ MILAGHAIBA · الموضوعات</span>
        <h2 style={{fontFamily:locale==="ar"?"Aref Ruqaa Ink,serif":"Cormorant Garamond,Georgia,serif",fontSize:"clamp(1.8rem,4vw,2.7rem)",color:"#f5d9a7",margin:".5rem 0"}}>
          {locale==="ar"?"اكتشف الأحاديث حسب الموضوع":locale==="en"?"Explore hadiths by topic":"Explorer les hadiths par grands thèmes"}
        </h2>
        <p style={{color:"#dfd9cb"}}>{locale==="ar"?"أبواب العقيدة والطهارة والزواج والأسرة والمعاملات وغيرها":locale==="en"?"Faith, purification, marriage, family, trade and more":"Foi, purification, mariage, famille, commerce, spiritualité, et bien d’autres domaines."}</p>
        <Link href="/themes" style={{display:"inline-block",background:"#e8c58a",padding:".8rem 1.3rem",borderRadius:"999px",color:"#182b22",fontWeight:800,textDecoration:"none"}}>
          {locale==="ar"?"تصفح الأبواب":locale==="en"?"Browse 16 chapters":"Découvrir les 16 grands chapitres"} ↗
        </Link>
      </section>

      <section className={styles.recherche} aria-labelledby="titre-recherche">
        <h2 id="titre-recherche" className="visuellement-cache">{t("accueil.recherche.titre")}</h2>
        <form role="search" action={`/${locale}/recherche`} method="get" className={styles.formulaire}>
          <label htmlFor="q" className="visuellement-cache">{t("accueil.recherche.etiquette")}</label>
          <div className={styles.barre}>
            <input id="q" name="q" type="search" dir="auto" placeholder={t("accueil.recherche.exemple")} className={styles.saisie} />
            <button type="submit" className={ui.bouton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              {t("accueil.recherche.bouton")}
            </button>
          </div>
          <fieldset className={styles.modes}>
            <legend className="visuellement-cache">{t("accueil.recherche.mode")}</legend>
            {modes.map((mode, index) => (
              <label key={mode.valeur} className={styles.mode}>
                <input type="radio" name="mode" value={mode.valeur} defaultChecked={index === 0} />
                <span>{t(mode.libelle)}</span>
              </label>
            ))}
          </fieldset>
          <SelecteurRecueil recueils={recueils()} categories={livresParCategorie()} />
        </form>
      </section>

      <section className={styles.memoireFeature}>
        <div className={styles.memoireEmbleme} aria-hidden="true">۞</div>
        <div>
          <h2>{t("memorisation.titre")}</h2>
          <p>{t("memorisation.intro")}</p>
        </div>
        <Link href="/memorisation">{t("navigation.memorisation")} <span aria-hidden="true">↗</span></Link>
      </section>

      <section className={styles.sources} aria-labelledby="titre-sources">
        <h2 id="titre-sources">{t("accueil.sources.titre")}</h2>
        <div className={styles.grille}>
          {shamila && (
            <article className={ui.carte}>
              <span className={ui.badge} data-ton="accent">{t("accueil.sources.shamila.badge")}</span>
              <h3>
                <bdi lang="ar" dir="rtl" className="texte-arabe">{shamila.nomAr}</bdi>{" "}
                <bdi lang="ar-Latn" dir="ltr">{shamila.nom}</bdi>
              </h3>
              <p>{t("accueil.sources.shamila.texte")}</p>
            </article>
          )}
          {sources.map((source) => (
            <article key={source.cle} className={ui.carte}>
              <span className={ui.badge} data-ton={source.ton}>{t(source.badge)}</span>
              <h3>{t(source.titre)}</h3>
              <p>{t(source.texte)}</p>
            </article>
          ))}
        </div>
      </section>

      <p className={styles.avertissement}>{t("accueil.avertissement")}</p>
    </main>
  );
}
