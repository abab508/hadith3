import { expect, test } from "@playwright/test";
import fr from "../../messages/fr.json" with { type: "json" };
import ar from "../../messages/ar.json" with { type: "json" };

// Le serveur de test tourne avec un dépôt en mémoire et un mot de passe d'essai (playwright.config.ts).
test("l'administrateur publie un article, qui apparaît dans la rubrique publique", async ({ page }) => {
  const titre = `Article d'essai ${Date.now()}`;
  await page.goto("/fr/admin/contenus");
  await page.getByLabel("Mot de passe administrateur").fill("mot-de-passe-de-test-1234");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByRole("button", { name: "+ Nouveau contenu" }).click();
  await page.getByLabel("Titre").fill(titre);
  await page.getByLabel("Résumé (affiché dans la liste)").fill("Un résumé court.");
  await page.getByLabel("Texte", { exact: true }).fill("## Intertitre\n\nPremier paragraphe avec **gras**.");
  await page.getByLabel("Publier sur le site").check();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Enregistré et publié.")).toBeVisible();

  await page.goto("/fr/actualites?rubrique=article");
  await page.getByRole("link", { name: new RegExp(titre) }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(titre);
  await expect(page.locator("main strong")).toHaveText("gras");
  await expect(page.getByRole("heading", { level: 2, name: "Intertitre" })).toBeVisible();
});

test("un mauvais mot de passe est refusé", async ({ page }) => {
  await page.goto("/fr/admin/contenus");
  await page.getByLabel("Mot de passe administrateur").fill("pas-le-bon-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("Mot de passe incorrect.")).toBeVisible();
});

test("la rubrique publique est dans le menu", async ({ page }) => {
  await page.goto("/fr");
  await page.locator("header").getByRole("link", { name: fr.navigation.actualites, exact: true }).first().click();
  await expect(page).toHaveURL(/\/fr\/actualites$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(fr.actualites.titre);
});

test("l'espace admin est traduit (arabe, de droite à gauche)", async ({ page }) => {
  await page.goto("/ar/admin/contenus");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(ar.adminContenus.titre);
  await expect(page.getByLabel(ar.adminContenus.motDePasse)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
