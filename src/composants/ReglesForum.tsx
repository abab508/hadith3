import { getTranslations } from "next-intl/server";
import styles from "@/app/[locale]/forum/Forum.module.css";

// Règles affichées en tête du forum (le filtre de mots les applique en partie automatiquement).
export default async function ReglesForum() {
  const t = await getTranslations("forum");
  return (
    <aside className={styles.regles} aria-labelledby="titre-regles">
      <h2 id="titre-regles" className={styles.sousTitre}>{t("regles.titre")}</h2>
      <ul>{(["r1", "r2", "r3", "r4"] as const).map((r) => <li key={r}>{t(`regles.${r}`)}</li>)}</ul>
    </aside>
  );
}
