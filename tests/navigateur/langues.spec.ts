import { expect, test } from "@playwright/test";
import brut from "../../data/langues/catalogue.json" with { type: "json" };
import { catalogueLangues } from "@/donnees/schemas/langue";

const catalogue = catalogueLangues.parse(brut);

test("/ redirige vers l'arabe, en RTL", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("passage ar → fr → ur depuis le sélecteur", async ({ page }) => {
  await page.goto("/ar");
  await page.locator('header a[hreflang="fr"]').click();
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Milaghaiba");
  await expect(page).toHaveTitle("Milaghaiba");

  await page.locator('header a[hreflang="ur"]').click();
  await expect(page).toHaveURL(/\/ur$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('header a[hreflang="ur"]')).toHaveAttribute("aria-current", "page");
});

test("la langue en cours n'est pas écrite deux fois (« français — français »)", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.locator('header a[hreflang="fr"]')).toHaveText("français");
  await expect(page.locator('header a[hreflang="en"]')).toHaveText("English — anglais");
});

test("le sélecteur conserve le chemin et tous les paramètres de recherche", async ({ page }) => {
  await page.goto("/fr/glossaire?q=test&filtre=a&filtre=b");
  const selecteur = page.locator("header nav");
  await expect(selecteur).toBeVisible();
  await expect(selecteur.getByRole("link").first()).toHaveAttribute("hreflang", catalogue.langueParDefaut);
  await expect(selecteur.locator('a[hreflang="es"]')).toContainText("Español");
  await expect(selecteur.locator('a[hreflang="es"]')).toContainText("espagnol");
  await selecteur.locator('a[hreflang="es"]').click();
  await expect(page).toHaveURL(/\/es\/glossaire\?q=test&filtre=a&filtre=b$/);
  await expect(page.locator('header a[hreflang="es"]')).toHaveAttribute("aria-current", "page");
  await page.locator('header a[hreflang="ar"]').click();
  await expect(page).toHaveURL(/\/ar\/glossaire\?q=test&filtre=a&filtre=b$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

for (const langue of catalogue.entrees.filter((langue) => langue.statut !== "desactivee" && langue.niveaux.interface)) {
  test(`interface ${langue.tag} : direction et sélecteur dans l'en-tête`, async ({ page }) => {
    await page.goto(`/${langue.tag}`);
    await expect(page.locator("html")).toHaveAttribute("lang", langue.tag);
    await expect(page.locator("html")).toHaveAttribute("dir", langue.direction);
    const selecteur = page.locator("header nav");
    await expect(selecteur).toBeVisible();
    await expect(selecteur.locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(selecteur.locator(`a[hreflang="${langue.tag}"] bdi[lang="${langue.tag}"]`)).toHaveAttribute("dir", langue.direction);
  });
}

test("le terme suit le format « Terme (arabe — translittération) » avec infobulle", async ({ page }) => {
  await page.goto("/fr");
  const terme = page.locator('[data-terme="hasan"]');
  await expect(terme).toContainText("Bon / fiable selon la catégorie technique (حسن — ḥasan)");
  const infobulle = page.getByRole("tooltip");
  await expect(infobulle).toBeHidden();
  await terme.focus();
  await expect(infobulle).toBeVisible();
  await expect(infobulle).toContainText("à valider par un spécialiste");
});

test("les polices Noto se chargent (arabe, ourdou, latin)", async ({ page }) => {
  for (const [chemin, famille, echantillon] of [
    ["/ar", "Noto Naskh Arabic", "حسن"],
    ["/ur", "Noto Nastaliq Urdu", "اردو"],
    ["/fr", "Noto Sans", "ḥasan"],
    ["/tr", "Noto Sans", "ğ ş ı İ"],
  ] as const) {
    await page.goto(chemin);
    const chargee = await page.evaluate(
      async ([f, e]) => {
        await document.fonts.load(`16px "${f}"`, e);
        return document.fonts.check(`16px "${f}"`, e);
      },
      [famille, echantillon],
    );
    expect(chargee, famille).toBe(true);
  }
});

test("une langue inconnue donne une page 404", async ({ page }) => {
  const reponse = await page.goto("/ar/zz");
  expect(reponse?.status()).toBe(404);
});
