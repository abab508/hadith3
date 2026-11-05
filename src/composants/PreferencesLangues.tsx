"use client";

import EntetePatrimoine from "@/composants/EntetePatrimoine";


import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { catalogue, entree, languesRoutables } from "@/donnees/catalogue";
import { languesDuSelecteur, nomLangueTraduit } from "@/donnees/langues-affichage";
import { preferencesParDefaut, type Preferences } from "@/donnees/preferences";
import { chargerPreferences, enregistrerPreferences } from "@/donnees/preferences-visiteur";
import { Link, useRouter } from "@/i18n/navigation";
import styles from "@/composants/PreferencesLangues.module.css";

// Transmet seulement l'annonce de succès lors d'une navigation entre deux langues.
let confirmationApresNavigation = false;

export default function PreferencesLangues() {
  const locale = useLocale();
  const t = useTranslations("pref");
  const navigation = useTranslations("navigation");
  const format = useFormatter();
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>(preferencesParDefaut);
  const [charge, setCharge] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const interfaceInitiale = useRef(preferencesParDefaut().interface);
  const langues = languesDuSelecteur();
  const routables = new Set(languesRoutables());
  const disponibles = langues.filter((langue) => routables.has(langue.tag));

  useEffect(() => {
    const memorisees = chargerPreferences();
    interfaceInitiale.current = memorisees.interface;
    setPreferences(memorisees);
    setCharge(true);
    if (confirmationApresNavigation) {
      confirmationApresNavigation = false;
      setConfirme(true);
    }
  }, [locale]);

  useEffect(() => {
    if (confirme) confirmation.current?.focus();
  }, [confirme]);

  function modifier(changements: Partial<Preferences>) {
    setPreferences((actuelles) => ({ ...actuelles, ...changements }));
    setConfirme(false);
  }

  function enregistrer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const interfaceModifiee = preferences.interface !== interfaceInitiale.current;
    const enregistrees = enregistrerPreferences(preferences);
    interfaceInitiale.current = enregistrees.interface;
    setPreferences(enregistrees);
    setConfirme(true);
    if (interfaceModifiee && enregistrees.interface !== locale) {
      confirmationApresNavigation = true;
      router.replace(`/parametres${window.location.search}${window.location.hash}`, { locale: enregistrees.interface });
    }
  }

  function nom(tag: string): string {
    const langue = entree(tag);
    return langue ? nomLangueTraduit(langue, locale) : tag;
  }

  const options = disponibles.map((langue) => (
    <option key={langue.tag} value={langue.tag} lang={langue.tag} dir={langue.direction}>
      {langue.nomNatif}{" — "}{nomLangueTraduit(langue, locale)}
    </option>
  ));

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p><Link href="/">{navigation("accueil")}</Link>{" / "}{navigation("parametres")}</p>
      <EntetePatrimoine scene="reglages">
        <h1>{t("titre")}</h1>
        <p>{t("intro")}</p>
      </EntetePatrimoine>
      {!charge ? <p role="status">{t("chargement")}</p> : (
        <form onSubmit={enregistrer}>
          <fieldset className={styles.groupe}>
            <legend>{t("interface.titre")}</legend>
            <p id="aide-interface">{t("interface.aide")}</p>
            <label htmlFor="langue-interface">{t("interface.titre")}</label>
            <select id="langue-interface" aria-describedby="aide-interface" value={preferences.interface}
              onChange={(evenement) => modifier({ interface: evenement.target.value })}>
              {options}
            </select>
          </fieldset>

          <fieldset className={styles.groupe}>
            <legend>{t("rapport.titre")}</legend>
            <p id="aide-rapport">{t("rapport.aide")}</p>
            <label htmlFor="langue-rapport">{t("rapport.titre")}</label>
            <select id="langue-rapport" aria-describedby="aide-rapport termes-rapport" value={preferences.rapport}
              onChange={(evenement) => modifier({ rapport: evenement.target.value })}>
              {options}
            </select>
            <p id="termes-rapport">{t("rapport.termes")}</p>
            {!entree(preferences.rapport)?.niveaux.validationHumaine && <p>{t("rapport.termesNonValides")}</p>}
          </fieldset>

          <fieldset className={styles.groupe} aria-describedby="aide-recherche arabe-toujours">
            <legend>{t("recherche.titre")}</legend>
            <p id="aide-recherche">{t("recherche.aide")}</p>
            <p id="arabe-toujours">{t("recherche.arabeToujours")}</p>
            <ul className={styles.langues}>
              {disponibles.map((langue) => (
                <li key={langue.tag}>
                  <label className={styles.choix} htmlFor={`recherche-${langue.tag}`}>
                    <input id={`recherche-${langue.tag}`} type="checkbox"
                      checked={preferences.recherche.includes(langue.tag)}
                      disabled={langue.tag === catalogue.langueParDefaut}
                      aria-describedby={langue.tag === catalogue.langueParDefaut ? "arabe-toujours" : undefined}
                      onChange={(evenement) => modifier({ recherche: evenement.target.checked
                        ? [...preferences.recherche, langue.tag]
                        : preferences.recherche.filter((tag) => tag !== langue.tag) })} />
                    <span>
                      <bdi lang={langue.tag} dir={langue.direction} style={{ fontFamily: `"${langue.police.famille}"` }}>{langue.nomNatif}</bdi>
                      {" — "}<bdi>{nomLangueTraduit(langue, locale)}</bdi>
                      {!langue.niveaux.contenuDocumentaire && <small>{t("recherche.peuDeSources")}</small>}
                      {!langue.niveaux.recherche && <small>{t("recherche.nonAdaptee")}</small>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {preferences.recherche.length === 1 && <p>{t("recherche.arabeSeul")}</p>}
          </fieldset>

          <p>{t("resume", { li: nom(preferences.interface), lr: nom(preferences.rapport), lrd: format.list(preferences.recherche.map(nom), { type: "conjunction" }) })}</p>
          <div className={styles.actions}>
            <button type="button" onClick={() => {
              const memorisees = chargerPreferences();
              interfaceInitiale.current = memorisees.interface;
              setPreferences(memorisees);
              setConfirme(false);
            }}>{t("annuler")}</button>
            <button type="submit">{t("enregistrer")}</button>
          </div>
        </form>
      )}
      <p id="confirmation-preferences" ref={confirmation} role="status" aria-live="polite" tabIndex={-1} className={styles.confirmation}>
        {confirme ? t("ok") : null}
      </p>
      <p>{t("visiteur")}</p>
      <p><Link href="/langues">{navigation("langues")}</Link></p>
    </main>
  );
}
