import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { corpus, bibliothequeParId, ouvrageParId, transmetteurParId } from "@/donnees/corpus";
import {
  chercher, chercherDansLivre, estArabe, estLivreAutreCategorie, estMode, hadithsDuTransmetteur,
  livresParCategorie, modes, numeroDemande, recueils, type Mode,
} from "@/donnees/recherche";
import SelecteurRecueil from "@/composants/SelecteurRecueil";
import ResultatsImportes from "@/composants/ResultatsImportes";
import ResultatsDistants, { RechercheDistanteLoading } from "@/composants/ResultatsDistants";
import ResultatsNumero from "@/composants/ResultatsNumero";
import type { Hadith, Occurrence } from "@/donnees/schemas/corpus";
import { Link } from "@/i18n/navigation";
import ui from "@/composants/Interface.module.css";
import styles from "@/app/[locale]/recherche/Recherche.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recherche" });
  return { title: t("titre") };
}

const correspondances = {
  original: { libelle: "correspondance.original", ton: "accent" },
  variante: { libelle: "correspondance.variante", ton: "accent" },
  reference: { libelle: "correspondance.reference", ton: undefined },
  similarite: { libelle: "correspondance.similarite", ton: "pointilles" },
} as const;

const libellesModes = {
  approximative: "modes.approximative",
  exacte: "modes.exacte",
  fragment: "modes.fragment",
  traduction: "modes.traduction",
  translitteration: "modes.translitteration",
  reference: "modes.reference",
  transmetteur: "modes.transmetteur",
  collection: "modes.collection",
} as const satisfies Record<Mode, string>;

// Valeur du filtre « ouvrages peu connus » (pas un identifiant d'ouvrage du corpus).
const PEU_CONNUS = "peu-connus";

export default async function Recherche({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<
    "q" | "mode" | "recueil" | "livre" | "filtre" | "correspondance" | "ouvrage" | "bibliotheque" | "page" | "pageImport" | "pageExterne",
    string | string[] | undefined
  >>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("recherche");
  const parametres = await searchParams;
  const tAccueil = await getTranslations("accueil");
  const premier1 = (valeur: string | string[] | undefined) => (Array.isArray(valeur) ? valeur[0] : valeur)?.trim() || undefined;
  const saisie = premier1(parametres.q);
  const brutMode = premier1(parametres.mode);
  const mode: Mode = estMode(brutMode) ? brutMode : "approximative";
  const livre = premier1(parametres.livre);
  // Un livre d'une autre catégorie (biographies…) remplace la recherche dans les recueils.
  const livreChoisi = livre && estLivreAutreCategorie(livre) ? ouvrageParId(livre) : undefined;
  const recueil = livreChoisi ? undefined : premier1(parametres.recueil);
  const dansLeLivre = livreChoisi ? chercherDansLivre(livreChoisi.id, saisie ?? "") : [];

  // Filtres envoyés par le formulaire (GET) : sans « filtre », tout est coché.
  const filtre = parametres.filtre !== undefined;
  const coches = (valeur: string | string[] | undefined) => new Set(valeur === undefined ? [] : [valeur].flat());
  const choix = {
    correspondance: coches(parametres.correspondance),
    ouvrage: coches(parametres.ouvrage),
    bibliotheque: coches(parametres.bibliotheque),
  };
  const garde = (groupe: keyof typeof choix, valeur: string) => !filtre || choix[groupe].has(valeur);
  // Recueil choisi ; un numéro seul vise le numéro du hadith dans ce recueil, pas dans un autre.
  const numero = saisie ? numeroDemande(saisie) : undefined;
  const dansSelection = (o: Occurrence) => (!recueil || o.ouvrage === recueil) && (!numero || o.numero === numero);

  const trouves = chercher(saisie ?? "", mode).filter((h) => h.occurrences.some(dansSelection));
  const collections = [...new Set(trouves.flatMap((h) => h.occurrences.map((o) => o.ouvrage)))].flatMap((id) => {
    const o = ouvrageParId(id);
    return o ? [o] : [];
  });
  // Un hadith par carte, avec tous ses témoins bibliographiques.
  const groupes = trouves.map((hadith) => ({
    hadith,
    occurrences: hadith.occurrences.filter((o) => dansSelection(o)
      && garde("correspondance", o.correspondance) && garde("ouvrage", o.ouvrage) && garde("bibliotheque", o.bibliotheque)),
  })).filter((g) => g.occurrences.length > 0);
  const nombreSources = groupes.reduce((s,g) => s+g.occurrences.length,0);
  const TAILLE_PAGE = 10;
  const paramPage = Number(premier1(parametres.page) ?? "1");
  const nbPages = Math.max(1, Math.ceil(groupes.length / TAILLE_PAGE));
  const page = Number.isSafeInteger(paramPage) && paramPage > 0 ? Math.min(nbPages, paramPage) : 1;
  const cartesPage = groupes.slice((page - 1) * TAILLE_PAGE, page * TAILLE_PAGE);
  const urlPage = (num: number) => {
    const p = new URLSearchParams();
    for (const [cle,valeur] of Object.entries(parametres)) {
      if (cle === "page") continue;
      if (Array.isArray(valeur)) valeur.forEach((v) => p.append(cle, v));
      else if (typeof valeur === "string") p.append(cle, valeur);
    }
    p.set("page", String(num));
    return "/recherche?" + p.toString();
  };
  // Une requête hors arabe qui mène à un seul hadith : on montre le texte arabe auquel elle a été rapprochée.
  const rapproche = saisie && !estArabe(saisie) && trouves.length === 1 ? trouves[0] : undefined;
  // L'exemple incertain (ouvrage peu connu d'OpenITI) illustre le hadith des intentions.
  const incertainVisible = trouves.some((h) => h.id === "niyyat") && !recueil && !numero
    && garde("correspondance", "similarite") && garde("ouvrage", PEU_CONNUS) && garde("bibliotheque", "openiti");

  function carte({ hadith, occurrences }: { hadith: Hadith; occurrences: Occurrence[] }) {
    const occurrence = occurrences[0]!;
    const traduction = hadith.traductions.find((x) => x.langue === locale);
    const premier = transmetteurParId(hadith.chaine.tronc[1] ?? hadith.chaine.tronc[0]!);
    const ouvrage = ouvrageParId(occurrence.ouvrage);
    const bibliotheque = bibliothequeParId(occurrence.bibliotheque);
    const correspondance = correspondances[occurrence.correspondance];
    const reference = t("numero", { ouvrage: ouvrage?.nom ?? occurrence.ouvrage, numero: occurrence.numero });
    return (
      <article key={hadith.id} className={`${ui.carte} ${styles.carteHadith}`} aria-labelledby={`resultat-${hadith.id}`}>
        <div className={styles.entete}>
          <h2 id={`resultat-${hadith.id}`} className={styles.titreResultat}>
            <bdi>{reference}</bdi>{" "}
            <span className={ui.discret}>
              · <bdi lang="ar" dir="rtl" className="texte-arabe">{occurrence.livreAr}</bdi> (<bdi lang="ar-Latn" dir="ltr">{occurrence.livre}</bdi>)
            </span>
          </h2>
          <span className={ui.badge} data-ton={correspondance.ton}>{t(correspondance.libelle)}</span>
        </div>
        {occurrence.texteAr ? (
          <p lang="ar" dir="rtl" className={`texte-arabe ${ui.arabeGrand}`}>{occurrence.texteAr}</p>
        ) : (
          <p className={ui.discret}>{t("referenceSeulement")}</p>
        )}
        {occurrence.texteAr && locale !== "ar" && (
          occurrence.correspondance === "original" && traduction ? (
            <div className={ui.traduction} data-origine={traduction.origine}>
              <p lang={traduction.langue}>{traduction.texte}</p>
              <span className={ui.mention}>
                {traduction.origine === "publiee" || traduction.origine === "validee"
                  ? t("traduction.publiee", { source: traduction.source ?? "" })
                  : t("traduction.ia")}
              </span>
            </div>
          ) : (
            <p className={`${ui.traduction} ${ui.discret}`}>{t("aucuneTraduction")}</p>
          )
        )}
        <p className={styles.meta}>
          {premier && occurrence.voie && (
            <span>
              {t("premierTransmetteur", { nom: premier.nomTranslittere })}{" "}
              <bdi lang="ar" dir="rtl" className="texte-arabe">({premier.nomAr})</bdi>
            </span>
          )}
          {bibliotheque && <span>{t("bibliotheque", { nom: bibliotheque.nom })}</span>}
        </p>
        <details className={styles.sourcesDetail}>
          <summary>{t("sourcesAssociees", { nombre: occurrences.length })} <span aria-hidden="true">⌄</span></summary>
          <ol className={styles.listeSources}>
            {occurrences.map((o) => {
              const source = ouvrageParId(o.ouvrage);
              const bibli = bibliothequeParId(o.bibliotheque);
              return (
                <li key={o.id}>
                  <div><bdi lang="ar" dir="rtl" className="texte-arabe">{source?.nomAr ?? o.ouvrage}</bdi>
                    <span className={styles.numeroRef}>№ <bdi dir="ltr">{o.numero}</bdi></span>
                  </div>
                  <p className={styles.sourceNote}>{t(correspondances[o.correspondance].libelle)} · {bibli?.nom ?? o.bibliotheque}</p>
                </li>
              );
            })}
          </ol>
          <p className={styles.sourceNote}>{t("sourceNote")}</p>
        </details>
        {occurrence.voie && (
          <div className={ui.actions}>
            <Link href={`/rapport/${hadith.id}`} className={ui.bouton}>{t("voirRapport")}</Link>
            <Link href={{ pathname: "/chaine", query: { hadith: hadith.id } }} className={ui.boutonSecondaire}>{t("parChaine")}</Link>
          </div>
        )}
      </article>
    );
  }

  return (
    <main id="contenu" tabIndex={-1} className={ui.page}>
      <div className={styles.requete}>
        <h1 id="titre-resultats" className={styles.titre}>{t("titre")}</h1>
        <form role="search" method="get" className={`${ui.carte} ${styles.nouvelleRecherche}`}>
          <div className={styles.ligneRecherche}>
            <label className={styles.champ}>
              <span>{tAccueil("recherche.etiquette")}</span>
              <input name="q" type="search" dir="auto" defaultValue={saisie} />
            </label>
            <label className={styles.champ}>
              <span>{tAccueil("recherche.mode")}</span>
              <select name="mode" defaultValue={mode}>
                {modes.map((m) => <option key={m} value={m}>{tAccueil(libellesModes[m])}</option>)}
              </select>
            </label>
          </div>
          <SelecteurRecueil
            recueils={recueils()}
            categories={livresParCategorie()}
            recueilInitial={recueil}
            livreInitial={livreChoisi?.id}
          />
          <button type="submit" className={ui.bouton}>{tAccueil("recherche.bouton")}</button>
        </form>
        {saisie && <p><bdi dir="auto">{t("requete", { requete: saisie })}</bdi></p>}
        {rapproche && (
          <p className={styles.rapprochee}>
            {t("rapprochee")}{" "}
            <bdi lang="ar" dir="rtl" className={`texte-arabe ${styles.requeteArabe}`}>{rapproche.requeteAr}</bdi>
          </p>
        )}
        <div className={styles.catalogueLink}>
          <Link href="/sources" className={ui.boutonSecondaire}>
            {locale === "ar" ? "↓ تنزيل كتب الحديث CSV ومراجعة المصادر" : locale === "en" ? "↓ Download hadith collections (CSV) and sources" : "↓ Télécharger les recueils CSV et consulter les sources"}
          </Link>
        </div>
        <p className={`${ui.badge} ${styles.exemple}`} data-ton="ocre">{t("exemple")}</p>
      </div>

      {!livreChoisi && saisie && numero && (
        <Suspense key={"numero:"+numero+":"+(recueil??"tous")} fallback={<p role="status">{locale==="ar"?"جارٍ البحث برقم الحديث…":"Recherche du numéro dans les recueils indexés…"}</p>}>
          <ResultatsNumero locale={locale} saisie={saisie} recueil={recueil} />
        </Suspense>
      )}

      {!livreChoisi && saisie && !numero && (
        <Suspense key={[saisie,recueil,parametres.pageExterne,locale].join(":")} fallback={<RechercheDistanteLoading locale={locale} />}>
          <ResultatsDistants
            locale={locale}
            saisie={saisie}
            recueil={recueil}
            page={Number(premier1(parametres.pageExterne) ?? "1")}
            recherche={urlPage(page).split("?")[1] ?? ""}
          />
        </Suspense>
      )}

      {livreChoisi ? (
        <section className={styles.resultats} aria-labelledby="titre-livre">
          <h2 id="titre-livre" className={styles.titreResultat}>
            {t("livre.titre", { livre: livreChoisi.nom })}{" "}
            <bdi lang="ar" dir="rtl" className={`texte-arabe ${ui.discret}`}>{livreChoisi.nomAr}</bdi>
          </h2>
          {dansLeLivre.map(({ transmetteur, reference }) => (
            <article key={transmetteur.id} className={ui.carte} aria-labelledby={`transmetteur-${transmetteur.id}`}>
              <h3 id={`transmetteur-${transmetteur.id}`} className={styles.titreResultat}>
                <bdi lang="ar" dir="rtl" className="texte-arabe">{transmetteur.nomAr}</bdi>{" "}
                <bdi lang="ar-Latn" dir="ltr">{transmetteur.nomTranslittere}</bdi>
              </h3>
              {transmetteur.verdictAr && <p lang="ar" dir="rtl" className="texte-arabe">{transmetteur.verdictAr}</p>}
              <p className={styles.meta}><span>{t("livre.reference", { reference: reference ?? t("livre.referenceACompleter") })}</span></p>
              <p className={styles.meta}>
                <span>{t("livre.apparait")}</span>
                {hadithsDuTransmetteur(transmetteur.id).map((h) => {
                  const o = h.occurrences[0]!;
                  return (
                    <Link key={h.id} href={`/rapport/${h.id}`}>
                      <bdi>{t("numero", { ouvrage: ouvrageParId(o.ouvrage)?.nom ?? o.ouvrage, numero: o.numero })}</bdi>
                    </Link>
                  );
                })}
              </p>
            </article>
          ))}
          {dansLeLivre.length === 0 && <p className={ui.carte} role="status">{t("aucunResultat")}</p>}
        </section>
      ) : (numero && groupes.length===0 ? null : (
      <div className={styles.colonnes}>
        <form method="get" className={`${ui.carte} ${styles.filtres}`} aria-labelledby="titre-filtres">
          <h2 id="titre-filtres" className={styles.titreFiltres}>{t("filtres.titre")}</h2>
          {saisie && <input type="hidden" name="q" value={saisie} />}
          {mode !== "approximative" && <input type="hidden" name="mode" value={mode} />}
          {recueil && <input type="hidden" name="recueil" value={recueil} />}
          {livre && <input type="hidden" name="livre" value={livre} />}
          <input type="hidden" name="filtre" value="1" />
          <fieldset className={styles.groupe}>
            <legend>{t("filtres.correspondance")}</legend>
            {(["original", "variante", "reference", "similarite"] as const).map((cle) => (
              <label key={cle}>
                <input type="checkbox" name="correspondance" value={cle} defaultChecked={garde("correspondance", cle)} />{" "}
                {t(correspondances[cle].libelle)}
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.groupe}>
            <legend>{t("filtres.collections")}</legend>
            {collections.map((o) => (
              <label key={o.id}>
                <input type="checkbox" name="ouvrage" value={o.id} defaultChecked={garde("ouvrage", o.id)} />{" "}
                <bdi lang="ar-Latn">{o.nom}</bdi>{" "}
                <bdi lang="ar" dir="rtl" className={`texte-arabe ${ui.discret}`}>{o.nomAr}</bdi>
              </label>
            ))}
            <label>
              <input type="checkbox" name="ouvrage" value={PEU_CONNUS} defaultChecked={garde("ouvrage", PEU_CONNUS)} />{" "}
              {t("filtres.peuConnus")}
            </label>
          </fieldset>
          <fieldset className={styles.groupe}>
            <legend>{t("filtres.bibliotheques")}</legend>
            {corpus.bibliotheques.map((b) => (
              <label key={b.id}>
                <input type="checkbox" name="bibliotheque" value={b.id} defaultChecked={garde("bibliotheque", b.id)} />{" "}
                <bdi>{b.nom}</bdi>{" "}
                <bdi lang="ar" dir="rtl" className={`texte-arabe ${ui.discret}`}>{b.nomAr}</bdi>
              </label>
            ))}
          </fieldset>
          <button type="submit" className={ui.bouton}>{t("filtres.appliquer")}</button>
        </form>

        <section className={styles.resultats} aria-labelledby="titre-resultats">
          <div className={styles.resumeResultats} role="status">
            <strong>{t("nombreResultats", {nombre:groupes.length, sources:nombreSources})}</strong>
            <span>{t("corpusLimite", {nombre:corpus.hadiths.length})}</span>
          </div>
          <p className={styles.sourceGuide}>{t("sourceGuide")}</p>
          {cartesPage.map(carte)}
          {incertainVisible && (
          <article className={`${ui.carte} ${styles.incertain}`} aria-labelledby="resultat-incertain">
            <div className={styles.entete}>
              <h2 id="resultat-incertain" className={styles.titreResultat}>{t("incertain.titre")}</h2>
              <span className={ui.badge} data-ton="pointilles">{t("correspondance.similarite")}</span>
            </div>
            <p>{t("incertain.texte")}</p>
            {locale !== "ar" && (
              <div className={ui.traduction} data-origine="ia">
                <span className={ui.mention}>{t("traduction.ia")}</span>
              </div>
            )}
          </article>
          )}
          {groupes.length === 0 && !incertainVisible && (
            <div className={ui.carte} role="status">
              <p>{t("aucunResultat")}</p>
              <p className={ui.discret}>{t("aucunResultatAide", { nombre: corpus.hadiths.length })}</p>
            </div>
          )}
          {nbPages > 1 && (
            <nav className={styles.pagination} aria-label={t("pagination")}>
              {page > 1 && <Link href={urlPage(page-1)}>{t("precedent")}</Link>}
              <span>{t("pageCompte", {page, total:nbPages})}</span>
              {page < nbPages && <Link href={urlPage(page+1)}>{t("suivant")}</Link>}
            </nav>
          )}
        </section>
      </div>
      ))}
      {!livreChoisi && (
        <ResultatsImportes
          locale={locale}
          saisie={saisie ?? ""}
          recueil={recueil}
          page={Number(premier1(parametres.pageImport) ?? "1")}
          recherche={urlPage(page).split("?")[1] ?? ""}
        />
      )}
    </main>
  );
}
