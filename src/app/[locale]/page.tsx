import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import Terme from "@/composants/Terme";
import SelecteurRecueil from "@/composants/SelecteurRecueil";
import SceneImmersive from "@/composants/SceneImmersive";
import ImageDecorative from "@/composants/ImageDecorative";
import messagesArabes from "../../../messages/ar.json" with { type: "json" };
import { livresParCategorie, recueils } from "@/donnees/recherche";
import { bibliothequeParId, hadithParId, transmetteurParId } from "@/donnees/corpus";
import type { CategorieTransmetteur } from "@/donnees/schemas/corpus";
import { catalogueRecueils } from "@/donnees/recueils";
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

const legendes = {
  source: "rapport.legende.source",
  compagnon: "rapport.legende.compagnon",
  thiqa: "rapport.legende.thiqa",
  saduq: "rapport.legende.saduq",
  daif: "rapport.legende.daif",
  compilateur: "rapport.legende.compilateur",
  "non-evalue": "rapport.legende.nonEvalue",
} as const satisfies Record<CategorieTransmetteur, string>;

const sources = [
  { cle: "ouverts", badge: "accueil.sources.ouverts.badge", titre: "accueil.sources.ouverts.titre", texte: "accueil.sources.ouverts.texte", ton: "accent" },
  { cle: "reserves", badge: "accueil.sources.reserves.badge", titre: "accueil.sources.reserves.titre", texte: "accueil.sources.reserves.texte", ton: undefined },
] as const;

export default function Accueil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();
  const shamila = bibliothequeParId("shamila");
  const totalRecueils = catalogueRecueils.recueils.length;
  // Aperçu du rapport : tronc commun du hadith d'exemple (données du corpus, rien d'inventé).
  const exemple = hadithParId("niyyat");
  const troncExemple = (exemple?.chaine.tronc ?? []).flatMap((id) => transmetteurParId(id) ?? []);
  // Titre arabe calligraphié (décoratif) au-dessus du titre, sauf quand la page est déjà en arabe.
  const titreArabe = locale === "ar" ? null : messagesArabes.accueil.hero.titre;

  return (
    <main id="contenu" tabIndex={-1} className={styles.accueil}>
      <section className={styles.hero} aria-labelledby="titre-accueil">
        <SceneImmersive className={styles.scene}>
        <div className={styles.decor} aria-hidden="true">
          {/* Décor restauré en haute définition ; les vrais textes restent posés par-dessus.
              Plans en profondeur : fond, rayons, étoiles, brume, braises, lueurs, halo qui suit la souris. */}
          <div className={styles.planFond}>
            <ImageDecorative className={styles.image} src="/images/hd/accueil.png" sizes="108vw" preload />
          </div>
          <span className={styles.rayons} />
          <span className={styles.etoiles} />
          <span className={`${styles.filante} ${styles.filanteA}`} />
          <span className={`${styles.filante} ${styles.filanteB}`} />
          <span className={`${styles.filante} ${styles.filanteC}`} />
          <span className={styles.lueurLune} />
          <span className={styles.lueurLanterne} />
          <span className={`${styles.brume} ${styles.brumeA}`} />
          <span className={`${styles.brume} ${styles.brumeB}`} />
          <div className={styles.planBraises}>
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} className={styles.braise} style={{ ["--i" as string]: i }} />
            ))}
          </div>
          <span className={styles.halo} />
          <span className={styles.vignette} />
        </div>
        <div className={styles.contenu}>
          {titreArabe && (
            <svg className={styles.calligraphie} viewBox="0 0 640 170" aria-hidden="true">
              <defs>
                <linearGradient id="or-calligraphie" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffe7ad" />
                  <stop offset=".7" stopColor="#e2ad56" />
                  <stop offset="1" stopColor="#b97f31" />
                </linearGradient>
              </defs>
              <text x="320" y="118" textAnchor="middle" direction="rtl" lang="ar">{titreArabe}</text>
            </svg>
          )}
          <h1 id="titre-accueil" className={styles.titre}>{t("accueil.hero.titre")}</h1>
          <p className={styles.sousTitre}>{t("accueil.hero.sousTitre")}</p>
          <p className={styles.texte}>{t("accueil.hero.texte")}</p>
          <Link href="/themes" className={styles.heroCTA}>
            {t("accueil.hero.bouton")} <span aria-hidden="true" className={styles.fleche}>→</span>
          </Link>
        </div>
        <ul className={styles.atouts}>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" /></svg>
            {t("accueil.hero.recueils", { n: totalRecueils })}
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 12 4l8 16M7 14h10" /></svg>
            {t("accueil.hero.az")}
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 8-8M4 4v8h8M12 8v4l3 2" /></svg>
            {t("accueil.hero.themes")}
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7v4c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7zM9 12l2 2 4-4" /></svg>
            {t("accueil.hero.navigation")}
          </li>
        </ul>
        </SceneImmersive>
      </section>

      <section className={styles.presentation} aria-labelledby="titre-presentation">
        <h2 id="titre-presentation" className={styles.nomSite}>{t("accueil.titre")}</h2>
        <p className={styles.sousTitrePresentation}>{t("accueil.sousTitre")}</p>
        <p className={`${ui.badge} ${styles.etat}`} data-ton="ocre">{t("accueil.etat")}</p>
        <p className={styles.terme}>
          {t("accueil.exempleTerme")} <Terme id="hasan" />
        </p>
        <div className={styles.heroActions}>
          <Link href="/bibliotheque" className={styles.heroSecondary}><span aria-hidden="true">۞</span> {t("navigation.bibliotheque")} <span aria-hidden="true">↗</span></Link>
          <Link href="/memorisation" className={styles.heroSecondary}>
            <span aria-hidden="true">✧</span> {t("navigation.memorisation")} <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/glossaire" className={styles.heroSecondary}>{t("accueil.glossaire")} <span aria-hidden="true">↗</span></Link>
        </div>
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

      {exemple && troncExemple.length > 0 && (
        <section className={styles.apercu} aria-labelledby="titre-apercu">
          <div className={styles.enteteApercu}>
            <h2 id="titre-apercu">{t("accueil.apercu.titre")}</h2>
            <p>{t("accueil.apercu.texte")}</p>
          </div>
          <ol className={styles.chaineApercu}>
            {troncExemple.map((tr, i) => (
              <li key={tr.id} data-categorie={tr.categorie} style={{ ["--i" as string]: i }}>
                <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.nomArApercu}`}>{tr.nomAr}</bdi>
                <bdi lang="ar-Latn" dir="ltr" className={styles.nomLatinApercu}>{tr.nomTranslittere}</bdi>
                <span className={styles.categorieApercu}>{t(legendes[tr.categorie])}</span>
              </li>
            ))}
          </ol>
          <Link href={`/rapport/${exemple.id}`} className={styles.boutonApercu}>
            {t("accueil.apercu.bouton")} <span aria-hidden="true">↗</span>
          </Link>
        </section>
      )}

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
