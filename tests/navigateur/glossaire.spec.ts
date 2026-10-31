import { expect, test } from "@playwright/test";
import ar from "../../messages/ar.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };

for (const { locale, direction, titre, domaine } of [
  { locale: "fr", direction: "ltr", titre: fr.glossaire.titre, domaine: fr.glossaire.domaines.authenticite },
  { locale: "ar", direction: "rtl", titre: ar.glossaire.titre, domaine: ar.glossaire.domaines.authenticite },
]) {
  test(`le glossaire ${locale} présente les domaines et les formes originales`, async ({ page }) => {
    await page.goto(`/${locale}/glossaire`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", direction);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(titre);
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(5);
    await expect(page.getByRole("heading", { level: 2, name: domaine, exact: true })).toBeVisible();
    const fiche = page.locator('article[data-terme="al-illa"]');
    await expect(fiche.locator('p[lang="ar"]')).toHaveText("العلة");
    await expect(fiche.locator('p[lang="ar"]').last()).toHaveAttribute("dir", "rtl");
    await expect(fiche.locator('[lang="ar-Latn"]')).toHaveText("al-ʿilla");
    await expect(fiche.locator('[lang="ar-Latn"]')).toHaveAttribute("dir", "ltr");
    await expect(page.locator("header nav")).toBeVisible();
  });
}

test("l'accueil donne accès au glossaire", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "Consulter le glossaire" }).click();
  await expect(page).toHaveURL(/\/fr\/glossaire$/);
});

test("le glossaire explique les termes sans afficher de badge de validation", async ({ page }) => {
  await page.goto("/ar/glossaire");
  const fiche = page.locator('article[data-terme="al-illa"]');
  await expect(fiche.locator('p[lang="ar"]')).toHaveCount(2);
  await expect(fiche.locator('p[lang="ar"]')).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("بانتظار تحقق متخصص")).toHaveCount(0);
});
