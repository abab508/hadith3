import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EXTERNAL_COLLECTIONS, remoteSearch } from "@/donnees/recherche-distante";
import styles from "@/composants/ResultatsRecueils.module.css";

// Résultats dans les grands recueils (index public hadith-api, en français et en arabe).
// Texte arabe → index arabe ; sinon index français. Seul le hadith affiché est téléchargé.
export function langueIndex(saisie: string): "ara" | "fra" {
  return /[؀-ۿ]/u.test(saisie) ? "ara" : "fra";
}

export default async function ResultatsRecueils({
  locale, saisie, recueil, page, recherche, chemin = "/recherche", taille = 10,
}: {
  locale: string; saisie: string; recueil?: string; page: number; recherche: string; chemin?: string; taille?: number;
}) {
  const t = await getTranslations({ locale, namespace: "recueils" });
  const q = saisie.trim();
  if (!q) return null;
  const choisi = EXTERNAL_COLLECTIONS.some((c) => c.id === recueil) ? recueil : undefined;
  const langue = langueIndex(q);
  const resultat = await remoteSearch(q, choisi, langue, Number.isSafeInteger(page) && page > 0 ? page : 1, taille);
  const urlPage = (n: number) => {
    const params = new URLSearchParams(recherche);
    params.set("pageRecueils", String(n));
    return `${chemin}?${params.toString()}`;
  };

  return (
    <section className={styles.section} aria-labelledby="titre-recueils">
      <div className={styles.entete}>
        <div>
          <h2 id="titre-recueils" className={styles.titre}>{t("titre")}</h2>
          <p className={styles.intro}>{t("intro")}</p>
        </div>
        <p className={styles.nombre} role="status">{t("nombre", { count: resultat.total })}</p>
      </div>

      {resultat.items.length > 0 ? (
        <ol className={styles.liste}>
          {resultat.items.map((h, i) => (
            <li key={h.id} className={styles.carte} style={{ ["--i" as string]: i }}>
              <div className={styles.haut}>
                <span className={styles.recueil}><bdi lang="ar-Latn">{h.nom}</bdi></span>
                <span className={styles.numero}><bdi dir="ltr">{t("numero", { numero: h.numero })}</bdi>{h.section ? <> · {t("livre", { livre: h.section })}</> : null}</span>
              </div>
              {h.texte ? (
                <p className={h.langue === "ara" ? `texte-arabe ${styles.texteArabe}` : styles.texte} lang={h.langue === "ara" ? "ar" : "fr"} dir={h.langue === "ara" ? "rtl" : "ltr"}>
                  {h.texte.length > 320 ? `${h.texte.slice(0, 320)}…` : h.texte}
                </p>
              ) : (
                <p className={styles.indisponible}>{t("indisponible")}</p>
              )}
              <div className={styles.bas}>
                {h.concordance?.status === "reference-confirmed" && <span className={styles.badge}>✓ {t("concordance")}</span>}
                <Link href={`/hadith/${h.recueil}/${h.langue}/${h.numero}`} className={styles.ouvrir}>{t("ouvrir")} <span aria-hidden="true">→</span></Link>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        langue === "fra" && <p className={styles.indisponible}>{t("astuceArabe")}</p>
      )}

      {resultat.pageTotal > 1 && (
        <nav className={styles.pagination} aria-label={t("titre")}>
          {resultat.page > 1 && <Link href={urlPage(resultat.page - 1)}>← {t("precedent")}</Link>}
          <span>{t("page", { page: resultat.page, total: resultat.pageTotal })}</span>
          {resultat.page < resultat.pageTotal && <Link href={urlPage(resultat.page + 1)}>{t("suivant")} →</Link>}
        </nav>
      )}
      <p className={styles.avertissement}>{t("avertissement")}</p>
    </section>
  );
}
