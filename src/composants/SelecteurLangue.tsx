"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { languesDuSelecteur, nomLangueTraduit } from "@/donnees/langues-affichage";
import { memoriserInterface } from "@/donnees/preferences-visiteur";
import { Link, usePathname } from "@/i18n/navigation";
import styles from "@/composants/SelecteurLangue.module.css";

const liens = [
  { href: "/recherche", cle: "recherche" },
  { href: "/chaine", cle: "chaine" },
  { href: "/glossaire", cle: "glossaire" },
  { href: "/parametres", cle: "parametres" },
  { href: "/langues", cle: "langues" },
] as const;

export default function SelecteurLangue() {
  const locale = useLocale();
  const t = useTranslations("selecteurLangue");
  const navigation = useTranslations("navigation");
  const chemin = usePathname();
  const requete = useSearchParams().toString();
  const destination = requete ? `${chemin}?${requete}` : chemin;

  return (
    <nav className={styles.selecteur} aria-label={t("titre")}>
      <p className={styles.titre}>{t("titre")}</p>
      <ul className={styles.langues}>
        {languesDuSelecteur().map((langue) => {
          // Pas de « français — français » : le nom traduit n'apparaît que s'il diffère du nom natif.
          const traduit = nomLangueTraduit(langue, locale);
          const nom = (
            <>
              <bdi lang={langue.tag} dir={langue.direction} style={{ fontFamily: `"${langue.police.famille}"` }}>
                {langue.nomNatif}
              </bdi>
              {traduit !== langue.nomNatif && (
                <>
                  {" — "}
                  <bdi>{traduit}</bdi>
                </>
              )}
            </>
          );
          return (
            <li key={langue.tag}>
              {langue.niveaux.interface ? (
                <Link href={destination} locale={langue.tag} hrefLang={langue.tag}
                  onClick={() => memoriserInterface(langue.tag)}
                  aria-current={langue.tag === locale ? "page" : undefined}>
                  {nom}
                </Link>
              ) : (
                <span className={styles.indisponible} aria-disabled="true">
                  {nom} <span>({t("indisponible")})</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <ul className={styles.liens} aria-label={navigation("titre")}>
        {liens.map(({ href, cle }) => (
          <li key={href}>
            <Link href={href} aria-current={chemin === href ? "page" : undefined}>{navigation(cle)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
