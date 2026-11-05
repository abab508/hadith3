import { expect, test } from "@playwright/test";
import fr from "../../messages/fr.json" with { type: "json" };

// Un clic sur un livre de la bibliothèque doit ouvrir sa vraie page, jamais rien ni la Recherche.
test("un livre des grandes compilations ouvre la page de son recueil", async ({ page }) => {
  await page.goto("/fr/bibliotheque");
  await page.getByRole("button", { name: fr.bibliotheque.familles.compilations.titre, exact: true }).click();
  const livre = page.locator('li[data-livre="al-matalib-al-aliya"]');
  await expect(livre).toHaveAttribute("data-disponible", "oui");
  // Clic au milieu de la carte (pas sur le petit bouton) : la carte entière est le lien.
  await livre.locator("article").click();
  await expect(page).toHaveURL(/\/fr\/recueil\/al-matalib-al-aliya$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Al-Matalib al-Aliya");
});

test("un livre sans page n'est plus un lien et le dit clairement", async ({ page }) => {
  await page.goto("/fr/bibliotheque");
  const livre = page.locator('li[data-livre="jami-al-usul"]');
  await expect(livre).toHaveAttribute("data-disponible", "non");
  await expect(livre.getByRole("link")).toHaveCount(0);
  await expect(livre).toContainText(fr.bibliotheque.indisponible);
});

test("un grand recueil ouvre son premier hadith, la recherche reste un bouton à part", async ({ page }) => {
  await page.goto("/fr/bibliotheque");
  const livre = page.locator('li[data-livre="sahih-bukhari"]');
  await expect(livre.getByRole("link", { name: fr.bibliotheque.cherchable })).toHaveAttribute("href", /recherche\?recueil=sahih-bukhari/);
  await livre.locator("article").click();
  await expect(page).toHaveURL(/\/fr\/hadith\/sahih-bukhari\/ara\/1$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bukhārī");
});
