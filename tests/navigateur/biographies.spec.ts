import { expect, test } from "@playwright/test";
import fr from "../../messages/fr.json" with { type: "json" };

test("le menu mène aux biographies et à la fiche d'un Compagnon", async ({ page }) => {
  await page.goto("/fr");
  await page.locator("header").getByRole("link", { name: fr.navigation.biographies, exact: true }).first().click();
  await expect(page).toHaveURL(/\/fr\/biographies$/);
  await expect(page.locator("li[data-serie]")).toHaveCount(5);
  await page.locator('li[data-serie="compagnons"] a').click();
  await expect(page).toHaveURL(/\/fr\/biographies\/compagnons$/);
  await page.locator('a[data-personne="4396"]').click();
  await expect(page).toHaveURL(/\/fr\/biographies\/personne\/4396$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("أبو هريرة");
  // Un maître qui a sa propre fiche est un lien vers elle.
  await page.locator('[data-voisins="maitres"] a').first().click();
  await expect(page).toHaveURL(/\/fr\/biographies\/personne\/\d+$/);
});

test("la série des prophètes ouvre un chapitre du site", async ({ page }) => {
  await page.goto("/fr/biographies/prophetes");
  const musa = page.locator('li[data-prophete="musa"]');
  await musa.locator("summary").click();
  await musa.locator("ul a").first().click();
  await expect(page).toHaveURL(/\/fr\/chapitres\/c\d+(\/s\d+)?$/);
});

test("la recherche d'un nom filtre la série", async ({ page }) => {
  await page.goto("/fr/biographies/successeurs?q=" + encodeURIComponent("سعيد بن المسيب"));
  await expect(page.locator("a[data-personne]").first()).toContainText("سعيد بن المسيب");
});
