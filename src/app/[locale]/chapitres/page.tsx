import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ListeChapitres, { type EntreeTheme } from "@/composants/ListeChapitres";
import { chapitresDuTheme, themes } from "@/donnees/themes";
import { clesChapitres, clesThemes } from "@/donnees/cles-themes";
import styles from "@/composants/Pages.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chapitres" });
  return { title: t("titre") };
}

// Menu latéral de la maquette (liens simples, la navigation principale reste dans l'en-tête).
const menu = [
  { href: "/", cle: "accueil", trace: "M4 11l8-7 8 7v9h-5v-6H9v6H4z" },
  { href: "/themes", cle: "themes", trace: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2" },
  { href: "/chapitres", cle: "chapitres", trace: "M5 5h6v14H5zM13 5h6v14h-6z" },
  { href: "/a-z", cle: "az", trace: "M4 19L9 5l5 14M6 14h6M15 9h5l-5 10h5" },
  { href: "/bibliotheque", cle: "bibliotheque", trace: "M5 4h3v16H5zM10 4h3v16h-3zM15 5l3-1 3 15-3 1z" },
  { href: "/parametres", cle: "parametres", trace: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" },
] as const;

export default async function PageChapitres({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("chapitres");
  const tt = await getTranslations("themes");
  const nav = await getTranslations("navigation");

  const entrees: EntreeTheme[] = themes.map((theme, i) => ({
    id: theme.id,
    numero: i + 1,
    titre: tt(clesThemes[theme.cle].titre),
    icone: theme.icone,
    chapitres: chapitresDuTheme(theme.id).map((c) => ({ id: c.id, titre: t(clesChapitres[c.cle].titre) })),
  }));

  return (
    <main id="contenu" tabIndex={-1} className={styles.pageChapitres}>
      <aside className={styles.menuLateral} aria-label={t("menu")}>
        <ul>
          {menu.map((m) => (
            <li key={m.href}>
              <Link href={m.href} aria-current={m.href === "/chapitres" ? "page" : undefined}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d={m.trace} /></svg>
                {nav(m.cle)}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className={styles.colonneChapitres} aria-labelledby="titre-chapitres">
        <h1 id="titre-chapitres" className={styles.titreSection}>{t("titre")}</h1>
        <ListeChapitres entrees={entrees} rechercher={t("rechercher")} aFournir={tt("chapitresAFournir")} />
      </section>
      <figure className={styles.citation}>
        <img src="/images/maquette/citation.jpg" alt="" />
        <blockquote>
          <p>{t("citation")}</p>
          <footer>{t("citationAuteur")}</footer>
        </blockquote>
        <figcaption className={styles.mention}>{t("citationReference")}</figcaption>
      </figure>
    </main>
  );
}
