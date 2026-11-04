import { expect, test } from "@playwright/test";
import ar from "../../messages/ar.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };

test("rapport fr : un clic sur un transmetteur ouvre sa fiche", async ({ page }) => {
  await page.goto("/fr/rapport/niyyat");
  await expect(page).toHaveTitle("Rapport : Ṣaḥīḥ al-Bukhārī, n° 1");
  await expect(page.locator('p[lang="ar"][dir="rtl"]').first()).toContainText("إِنَّمَا الأَعْمَالُ");
  const fiche = page.locator("#fiche-transmetteur");
  // Le dernier maillon du tronc commun est choisi d'office.
  await expect(fiche.locator('[lang="ar-Latn"]').first()).toHaveText("Yaḥyā ibn Saʿīd al-Anṣārī");

  // Les relations de la fiche sont aussi des boutons : on vise la chaîne (refonte 2026-11-04).
  const taymi = page.locator('section[aria-labelledby="titre-isnad"]').getByRole("button", { name: /Muḥammad ibn Ibrāhīm al-Taymī/ });
  await taymi.click();
  await expect(taymi).toHaveAttribute("aria-pressed", "true");
  await expect(fiche.locator('p[lang="ar"]').first()).toHaveText("محمد بن إبراهيم التيمي");
  // La réserve d'Aḥmad ibn Ḥanbal est signalée, pas cachée.
  await fiche.getByRole("tab", { name: fr.rapport.fiche.fiabilite }).click(); // onglet Fiabilité (refonte 2026-11-04)
  await expect(fiche.getByText(fr.rapport.fiche.reserve, { exact: true })).toBeVisible();
  await fiche.getByRole("tab", { name: fr.rapport.fiche.biographie }).click();
  await expect(fiche.getByText("ʿAlqama ibn Waqqāṣ al-Laythī")).toBeVisible();
});

test("rapport d'un hadith importé : transmetteurs non évalués, sans conclusion rassurante", async ({ page }) => {
  await page.goto("/fr/rapport/bukhari-8");
  await expect(page.locator('p[lang="ar"][dir="rtl"]').first()).toContainText("الْإِيمَانُ بِضْعٌ");
  await expect(page.getByText(fr.rapport.legende.nonEvalue).first()).toBeVisible();
  await expect(page.getByText(fr.rapport.aucunFaible)).toHaveCount(0);
  await page.getByRole("button", { name: /Abū Hurayra/ }).click();
  await expect(page.locator("#fiche-transmetteur")).toContainText(fr.rapport.fiche.aucunJugement);
  await expect(page.getByText("Sanadset 650K").first()).toBeVisible();
});

test("rapport ar : page en RTL, sans traduction ni texte de repli vide", async ({ page }) => {
  await page.goto("/ar/rapport/niyyat");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("إنما الأعمال بالنيات");
  await expect(page.getByRole("heading", { name: ar.rapport.isnad })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: ar.rapport.colonneAcces })).toBeVisible();
});

test("le menu signale la page en cours", async ({ page }) => {
  // « Recherche par chaîne » n'est plus dans le menu (2026-11-04) : on vérifie avec le glossaire.
  await page.goto("/fr/glossaire");
  const menu = page.getByRole("list", { name: fr.navigation.titre });
  await expect(menu.getByRole("link", { name: fr.navigation.glossaire, exact: true })).toHaveAttribute("aria-current", "page");
  await expect(menu.getByRole("link", { name: fr.navigation.recherche, exact: true })).not.toHaveAttribute("aria-current", "page");
});

test("recherche réelle : le texte arabe sans voyelles trouve le bon hadith, et seulement lui", async ({ page }) => {
  await page.goto("/fr");
  await page.getByLabel(fr.accueil.recherche.etiquette).fill("الإيمان بضع وستون");
  await page.getByLabel(fr.accueil.recherche.etiquette).press("Enter");
  await expect(page).toHaveURL(/\/fr\/recherche\?q=/);
  const resultats = page.locator('section[aria-labelledby="titre-resultats"] > article');
  await expect(resultats).toHaveCount(1);
  await expect(resultats.first()).toContainText("الْإِيمَانُ بِضْعٌ");
  await resultats.first().getByRole("link", { name: fr.recherche.voirRapport }).click();
  await expect(page).toHaveURL(/\/fr\/rapport\/bukhari-8$/);
});

test("recueil choisi : un numéro vise le numéro de ce recueil, pas d'un autre", async ({ page }) => {
  const resultats = page.locator('section[aria-labelledby="titre-resultats"] > article');
  await page.goto("/fr/recherche?q=1907&recueil=sahih-muslim");
  await expect(resultats).toHaveCount(1);
  await expect(resultats.first()).toContainText("Ṣaḥīḥ Muslim, n° 1907");
  // Le hadith des intentions porte le n° 1 chez al-Bukhārī, pas chez Muslim.
  await page.goto("/fr/recherche?q=1&recueil=sahih-muslim");
  await expect(resultats).toHaveCount(0);
  await page.goto("/fr/recherche?q=" + encodeURIComponent("١٣") + "&recueil=sahih-bukhari");
  await expect(resultats).toHaveCount(1);
  await expect(resultats.first()).toContainText("n° 13");
});

test("livre d'une autre catégorie : exclusif du recueil, cherche les transmetteurs par nom", async ({ page }) => {
  await page.goto("/fr");
  const recueil = page.getByRole("combobox", { name: fr.recherche.selection.recueil, exact: true });
  const livre = page.getByRole("combobox", { name: fr.recherche.selection.livre, exact: true });
  // Le sélecteur de livre ne contient aucun recueil de hadith.
  await expect(livre.locator('option[value="sahih-bukhari"]')).toHaveCount(0);
  await recueil.selectOption("sahih-muslim");
  await livre.selectOption("taqrib");
  await expect(recueil).toHaveValue("");
  await page.getByLabel(fr.accueil.recherche.etiquette).fill("Sufyan");
  await page.getByLabel(fr.accueil.recherche.etiquette).press("Enter");
  await expect(page).toHaveURL(/livre=taqrib/);
  const fiches = page.locator('section[aria-labelledby="titre-livre"] > article');
  await expect(fiches).toHaveCount(1);
  await expect(fiches.first()).toContainText("Sufyān ibn ʿUyayna");
  await fiches.first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/fr\/rapport\/niyyat$/);
});

test("livre d'une autre catégorie : recherche par numéro de notice", async ({ page }) => {
  await page.goto("/fr/recherche?livre=taqrib&q=" + encodeURIComponent("٢٤٥١"));
  const fiches = page.locator('section[aria-labelledby="titre-livre"] > article');
  await expect(fiches).toHaveCount(1);
  await expect(fiches.first()).toContainText("n° 2451");
});

test("recherche réelle : un mot absent donne « aucun résultat »", async ({ page }) => {
  await page.goto("/fr/recherche?q=zzzz");
  await expect(page.getByRole("status").filter({ hasText: fr.recherche.aucunResultat })).toBeVisible();
});

test("résultats : les filtres retirent et rendent les résultats", async ({ page }) => {
  await page.goto("/fr/recherche?q=intentions");
  // Une carte par hadith (références regroupées dedans) + la carte « résultat incertain » d'exemple.
  const resultats = page.locator('section[aria-labelledby="titre-resultats"] > article');
  await expect(resultats).toHaveCount(2);
  await expect(resultats.first().locator("summary")).toContainText("(3)");

  await page.getByLabel(fr.recherche.correspondance.reference).uncheck();
  await page.getByLabel(fr.recherche.correspondance.similarite).uncheck();
  await page.getByRole("button", { name: fr.recherche.filtres.appliquer }).click();
  await expect(page).toHaveURL(/filtre=1/);
  await expect(page).toHaveURL(/q=intentions/);
  await expect(resultats).toHaveCount(1);
  await expect(resultats.first().locator("summary")).toContainText("(2)");
  await expect(page.getByLabel(fr.recherche.correspondance.reference)).not.toBeChecked();

  for (const cle of ["original", "variante"] as const) {
    await page.getByLabel(fr.recherche.correspondance[cle]).uncheck();
  }
  await page.getByRole("button", { name: fr.recherche.filtres.appliquer }).click();
  await expect(resultats).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: fr.recherche.aucunResultat })).toBeVisible();
});

test("recherche par chaîne : ajouter, retirer un transmetteur puis générer le rapport", async ({ page }) => {
  await page.goto("/fr/chaine?hadith=niyyat");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(fr.chaine.titre);

  const saisie = page.getByLabel(fr.chaine.ajouter);
  await saisie.fill("ʿUmar ibn al-Khaṭṭāb");
  const retirer = page.getByRole("button", { name: "Retirer ʿUmar ibn al-Khaṭṭāb" });
  await expect(retirer).toBeVisible();
  await expect(saisie).toHaveValue("");
  await retirer.click();
  await expect(retirer).toHaveCount(0);

  const resume = page.locator("#resume-chaine");
  await expect(resume).toContainText("23 ouvrages");
  // Les ouvrages sont repliés dans « Options avancées » (page simplifiée, 2026-11-04).
  await page.getByText(fr.chaine.options).click();
  await page.getByRole("button", { name: /Ṣaḥīḥ Muslim/ }).click();
  await expect(resume).toContainText("22 ouvrages");

  await page.getByRole("link", { name: fr.chaine.generer }).click();
  await expect(page).toHaveURL(/\/fr\/rapport\/niyyat$/);
});

test("recherche par chaîne : retrouver le hadith par un mot ou par un numéro, puis le choisir", async ({ page }) => {
  await page.goto("/fr/chaine");
  await page.getByLabel(fr.chaine.chercherHadith).fill("النيات");
  await page.getByRole("button", { name: fr.chaine.chercherBouton, exact: true }).click();
  await expect(page).toHaveURL(/\/fr\/chaine\?q=/);
  const trouves = page.getByRole("button", { name: /Ṣaḥīḥ al-Bukhārī, n° 1\b/ });
  await expect(trouves.first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel(fr.chaine.hadith, { exact: true })).toHaveValue("niyyat");

  // Par numéro : le hadith n° 8 est trouvé et choisi d'office ; le rapport suit ce choix.
  await page.goto("/fr/chaine?q=8");
  await expect(page.getByLabel(fr.chaine.hadith, { exact: true })).toHaveValue("bukhari-8");
  await page.getByRole("link", { name: fr.chaine.generer }).click();
  await expect(page).toHaveURL(/\/fr\/rapport\/bukhari-8$/);
});

test("recherche par chaîne : toute la base est interrogée, récits arabes sans chaîne signalés honnêtement", async ({ page }) => {
  // Un mot arabe trouve aussi les récits importés (texte arabe seul) : choisis, ils ne donnent pas de faux rapport.
  await page.goto("/fr/chaine?q=" + encodeURIComponent("الماء"));
  const recits = page.locator('[aria-labelledby="titre-votre-recherche"] button[aria-pressed]').filter({ hasText: /n° \d+/ });
  expect(await recits.count()).toBeGreaterThan(0);
  await expect(page.getByText(fr.chaine.chaineNonAnalysee)).toBeVisible();
  await expect(page.getByRole("link", { name: fr.chaine.generer })).toHaveCount(0);

  // Un mot absent de toute la base (grands recueils compris) : la page conseille de chercher en arabe.
  await page.goto("/fr/chaine?q=xyzqvw");
  await expect(page.getByText(fr.chaine.astuceArabe)).toBeVisible();
});

test("recherche : un mot français trouve les hadiths des grands recueils, puis le rapport et la chaîne", async ({ page }) => {
  await page.goto("/fr/recherche?q=boire");
  const section = page.locator('section[aria-labelledby="titre-recueils"]');
  await expect(section.getByRole("status")).toContainText(/\d+ hadiths trouvés dans les recueils/);
  const premier = section.getByRole("link", { name: fr.recueils.ouvrir }).first();
  await expect(premier).toHaveAttribute("href", /\/fr\/hadith\/[a-z-]+\/fra\/\d+$/);

  // Page d'un hadith : le bouton mène au rapport et à la chaîne de transmission, sur une autre page.
  await page.goto("/fr/hadith/sahih-bukhari/fra/1");
  await page.getByRole("link", { name: fr.rapportTexte.bouton }).click();
  await expect(page).toHaveURL(/\/fr\/hadith\/sahih-bukhari\/fra\/1\/rapport$/);
  await expect(page.getByRole("heading", { name: fr.rapportTexte.chaine })).toBeVisible();
  // Bukhārī n° 1 fait partie du corpus analysé : le rapport détaillé est proposé.
  await expect(page.getByRole("link", { name: fr.fiche.ouvrirRapport })).toHaveAttribute("href", "/fr/rapport/niyyat");
});

test("bibliothèque : un recueil hadith-kg se lit, puis son rapport montre les fiches des transmetteurs", async ({ page }) => {
  await page.goto("/fr/bibliotheque");
  const lien = page.getByRole("link", { name: new RegExp(fr.bibliotheque.lire.replace("{n, number}", String.raw`26\s?985`)) });
  await expect(lien).toBeVisible();
  await lien.click();
  await expect(page).toHaveURL(/\/fr\/recueil\/musnad-ahmad$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Musnad");
  await page.getByRole("link", { name: /^n° 1 / }).click();
  await expect(page).toHaveURL(/\/fr\/recueil\/musnad-ahmad\/1$/);
  await page.getByRole("link", { name: fr.rapportTexte.bouton }).click();
  await expect(page).toHaveURL(/\/fr\/recueil\/musnad-ahmad\/1\/rapport$/);
  await expect(page.getByRole("heading", { name: fr.rapportTexte.chaine })).toBeVisible();
  await expect(page.locator("#fiche-transmetteur")).toContainText(fr.rapportTexte.nomComplet);
});
