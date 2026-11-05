import { expect, test } from "@playwright/test";

const parcours = [
  ["/recherche", "recherche"], ["/chaine", "recherche"],
  ["/biographies", "biographies"], ["/biographies/compagnons", "biographies"],
  ["/biographies/personne/4883", "biographies"],
  ["/glossaire", "glossaire"], ["/memorisation", "memorisation"],
  ["/langues", "langues"], ["/parametres", "reglages"],
  ["/recueil/sahih-bukhari", "lecture"], ["/recueil/musnad-ahmad/1", "lecture"],
  ["/hadith/sahih-bukhari/ara/8", "lecture"],
  ["/chapitres/c3/s4", "lecture"],
] as const;

for (const locale of ["fr", "ar"]) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    test(`charte ${locale} ${viewport.width} : décors et lecture accessibles dans chaque rubrique`, async ({ page }) => {
      test.setTimeout(150_000);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const [chemin, decor] of parcours) {
        const reponse = await page.goto(`/${locale}${chemin}`);
        expect(reponse?.ok(), chemin).toBe(true);
        const entete = page.locator(`main header[data-decor="${decor}"]`);
        await expect(entete, chemin).toHaveCount(1);
        const titre = entete.getByRole("heading", { level: 1 });
        await expect(titre, chemin).toBeVisible();
        const image = entete.locator("img");
        await expect(image).toHaveAttribute("alt", "");
        await expect(image).toHaveAttribute("aria-hidden", "true");
        await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth), { message: chemin }).toBeGreaterThan(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), chemin).toBe(true);
        expect(await entete.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length), chemin).toBe(0);
        if (chemin === "/biographies") {
          const sources = await page.locator('main li[data-serie] img').evaluateAll((images) => images.map((el) => new URL((el as HTMLImageElement).src).searchParams.get("url")));
          expect(sources).toHaveLength(5);
          expect(new Set(sources).size).toBe(5);
        }
      }
    });
  }
}
