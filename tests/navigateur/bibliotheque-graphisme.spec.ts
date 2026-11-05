import { expect, test } from "@playwright/test";

for (const locale of ["fr", "ar"]) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }, { width: 3840, height: 2160 }]) {
    test(`bibliothèque ${locale} ${viewport.width} : décor, filtres et mouvement réduit`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}/bibliotheque`);
      const decor = page.locator('main img[src*="salle-lecture"]');
      await expect(decor).toBeVisible();
      await expect.poll(() => decor.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("main article")).toHaveCount(68);
      await page.getByRole("searchbox").fill("Sahih Al-Boukhari");
      await expect(page.locator("main article")).toHaveCount(1);
      const lien = page.locator('main article a[href*="/recherche?recueil="]');
      await expect(lien).toHaveAttribute("href", `/${locale}/recherche?recueil=sahih-bukhari`);
      await page.getByRole("searchbox").fill("zz-introuvable-zz");
      await expect(page.locator("main article")).toHaveCount(0);
      await page.getByRole("searchbox").fill("");
      await expect(page.locator("main article")).toHaveCount(68);
      await page.locator("main").getByRole("group").getByRole("button").nth(1).click();
      await expect(page.locator('main section[data-famille]')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const animations = await page.locator("main").evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length);
      expect(animations).toBe(0);
    });
  }
}
