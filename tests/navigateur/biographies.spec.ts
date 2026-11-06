import { expect, test } from "@playwright/test";
import fr from "../../messages/fr.json" with { type: "json" };
import ar from "../../messages/ar.json" with { type: "json" };

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

for (const [langue, m] of [["fr", fr], ["ar", ar]] as const) {
  test(`${langue} : la fiche d'Abū Bakr montre sa courte vidéo, sans lecture automatique, avec le texte de la voix off`, async ({ page, request }) => {
    await page.goto(`/${langue}/biographies/personne/4945`);
    const bloc = page.locator('[data-video="abou-bakr-siddiq"]');
    await expect(bloc.getByRole("heading", { level: 2 })).toHaveText(m.biographies.video.titre);
    const video = bloc.locator("video");
    await expect(video).toHaveAttribute("poster", "/videos/abou-bakr-siddiq.jpg");
    await expect(video).toHaveAttribute("preload", "metadata");
    await expect(video).toHaveAttribute("controls", "");
    expect(await video.getAttribute("autoplay")).toBeNull();
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await expect(bloc.getByText(m.biographies.video.description)).toBeVisible();
    // Le texte de la voix off s'ouvre à la demande : arabe original, puis le sous-titre français.
    await bloc.locator("summary").click();
    await expect(bloc.locator('ol p[lang="ar"]').first()).toContainText("أبو بكرٍ الصِّدِّيق");
    await expect(bloc.locator('ol p[lang="fr"]').first()).toContainText("Abou Bakr as-Siddîq");
    // Le fichier et son affiche sont bien servis par le site.
    expect((await request.head("/videos/abou-bakr-siddiq.mp4")).status()).toBe(200);
    expect((await request.head("/videos/abou-bakr-siddiq.jpg")).status()).toBe(200);
  });
}

test("une fiche sans vidéo n'affiche aucun lecteur", async ({ page }) => {
  await page.goto("/fr/biographies/personne/4396");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("أبو هريرة");
  await expect(page.locator("[data-video], video")).toHaveCount(0);
});
