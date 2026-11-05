import { getTranslations } from "next-intl/server";
import styles from "@/app/[locale]/forum/Forum.module.css";
import { CLES_REGLES } from "@/donnees/cles-interface";

// Règles affichées en tête du forum (le filtre de mots les applique en partie automatiquement).
export default async function ReglesForum() {
  const t = await getTranslations("forum");
  return (
    <aside className={styles.regles} aria-labelledby="titre-regles">
      <h2 id="titre-regles" className={styles.sousTitre}>{t("regles.titre")}</h2>
      <ul>{CLES_REGLES.map((r) => <li key={r}>{t(r)}</li>)}</ul>
    </aside>
  );
}
