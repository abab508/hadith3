import { expect, test } from "@playwright/test";
import ar from "../../messages/ar.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };

test("rapport fr : un clic sur un transmetteur ouvre sa fiche", async ({ page }) => {
  await page.goto("/fr/rapport/niyyat");
  await expect(page.locator('p[lang="ar"][dir="rtl"]').first()).toContainText("إِنَّمَا الأَعْمَالُ");
  const fiche = page.locator("#fiche-transmetteur");
  // Le dernier maillon du tronc commun est choisi d'office.
  await expect(fiche.locator('[lang="ar-Latn"]').first()).toHaveText("Yaḥyā ibn Saʿīd al-Anṣārī");

  const taymi = page.getByRole("button", { name: /Muḥammad ibn Ibrāhīm al-Taymī/ });
  await taymi.click();
  await expect(taymi).toHaveAttribute("aria-pressed", "true");
  await expect(fiche.locator('p[lang="ar"]').first()).toHaveText("محمد بن إبراهيم التيمي");
  // La réserve d'Aḥmad ibn Ḥanbal est signalée, pas cachée.
  await expect(fiche.getByText(fr.rapport.fiche.reserve, { exact: true })).toBeVisible();
  await expect(fiche.getByText("ʿAlqama ibn Waqqāṣ al-Laythī")).toBeVisible();
});

test("rapport ar : page en RTL, sans traduction ni texte de repli vide", async ({ page }) => {
  await page.goto("/ar/rapport/niyyat");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("إنما الأعمال بالنيات");
  await expect(page.getByRole("heading", { name: ar.rapport.isnad })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: ar.rapport.colonneAcces })).toBeVisible();
});

test("le menu signale la page en cours", async ({ page }) => {
  await page.goto("/fr/chaine");
  const menu = page.getByRole("list", { name: fr.navigation.titre });
  await expect(menu.getByRole("link", { name: fr.navigation.chaine, exact: true })).toHaveAttribute("aria-current", "page");
  await expect(menu.getByRole("link", { name: fr.navigation.recherche, exact: true })).not.toHaveAttribute("aria-current", "page");
});

test("résultats : les filtres retirent et rendent les résultats", async ({ page }) => {
  await page.goto("/fr/recherche?q=intentions");
  const resultats = page.locator('section[aria-labelledby="titre-resultats"] > article');
  await expect(resultats).toHaveCount(4);

  await page.getByLabel(fr.recherche.correspondance.reference).uncheck();
  await page.getByLabel(fr.recherche.correspondance.similarite).uncheck();
  await page.getByRole("button", { name: fr.recherche.filtres.appliquer }).click();
  await expect(page).toHaveURL(/filtre=1/);
  await expect(page).toHaveURL(/q=intentions/);
  await expect(resultats).toHaveCount(2);
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
  await page.getByRole("button", { name: /Ṣaḥīḥ Muslim/ }).click();
  await expect(resume).toContainText("22 ouvrages");

  await page.getByRole("link", { name: fr.chaine.generer }).click();
  await expect(page).toHaveURL(/\/fr\/rapport\/niyyat$/);
});
