import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chapitres, imageTheme, themes } from "../../src/donnees/themes";

const parcours = ["", "/themes", "/themes/fin-des-temps", "/chapitres", "/chapitres/signes-mineurs", "/a-z", "/rapport/niyyat", "/hadith/sahih-bukhari/fra/201/rapport", "/recueil/musnad-ahmad/1/rapport"];
const ecrans = [
  { nom: "4K", viewport: { width: 3840, height: 2160 } },
  { nom: "mobile", viewport: { width: 390, height: 844 } },
];
// Captures de livraison opt-in ; aucune sortie supplémentaire lors des tests usuels.
const dossierCaptures = process.env.MILAGHAIBA_CAPTURE_DIR;
if (dossierCaptures) mkdirSync(dossierCaptures, { recursive: true });

for (const ecran of ecrans) {
  test.describe(`décors HD — ${ecran.nom}`, () => {
    test.use({ viewport: ecran.viewport, reducedMotion: "reduce" });

    for (const locale of ["ar", "fr"]) {
      for (const chemin of parcours) {
        test(`${locale}${chemin || "/"} : images chargées et largeur stable`, async ({ page }) => {
          const reponse = await page.goto(`/${locale}${chemin}`);
          expect(reponse?.ok()).toBe(true);
          const images = page.locator("main img");
          for (const image of await images.all()) {
            if (!(await image.isVisible())) continue;
            await image.scrollIntoViewIfNeeded();
            await expect(image).toHaveAttribute("alt", "");
            await expect(image).toHaveAttribute("aria-hidden", "true");
            await expect(image).toHaveAttribute("data-nimg", "fill");
            await expect(image).toHaveAttribute("sizes", /\S/);
            await expect.poll(() => image.evaluate((element) => {
              const img = element as HTMLImageElement;
              return img.complete && img.naturalWidth > 0;
            })).toBe(true);
            const source = await image.evaluate((element) => {
              const img = element as HTMLImageElement;
              const adresse = new URL(img.currentSrc, window.location.href);
              return adresse.searchParams.get("url") ?? adresse.pathname;
            });
            expect(source).toMatch(/^\/images\/hd\/[a-z0-9-]+\.png$/);
          }
          if (ecran.nom === "mobile" && chemin === "/themes/fin-des-temps") {
            const texte = await page.locator('main section[aria-labelledby="titre-theme"] p').boundingBox();
            const carte = await page.locator('main a[href*="/chapitres/"]').first().boundingBox();
            expect(texte).not.toBeNull();
            expect(carte).not.toBeNull();
            expect(carte!.y).toBeGreaterThanOrEqual(texte!.y + texte!.height);
          }
          const largeur = await page.evaluate(() => ({
            document: document.documentElement.scrollWidth,
            ecran: document.documentElement.clientWidth,
          }));
          expect(largeur.document).toBeLessThanOrEqual(largeur.ecran + 1);

          if (chemin === "/themes") {
            const dimensions = await page.locator('main img').first().evaluate((image) => {
              const cadre = image.parentElement!.getBoundingClientRect();
              return { largeur: cadre.width, hauteur: cadre.height };
            });
            // Le cadre mobile réserve la même proportion que la carte de référence.
            expect(dimensions.hauteur).toBeCloseTo(dimensions.largeur * 377 / 763, 0);
          }
          if (dossierCaptures && locale === "fr" && ["", "/themes", "/chapitres", "/chapitres/signes-mineurs", "/themes/fin-des-temps"].includes(chemin)) {
            await page.evaluate(() => {
              document.querySelectorAll("main ul").forEach((element) => { element.scrollLeft = 0; });
              window.scrollTo(0, 0);
            });
            await page.screenshot({
              path: join(dossierCaptures, `${ecran.nom}-fr-${chemin ? chemin.slice(1).replaceAll("/", "-") : "accueil"}.png`),
              animations: "disabled",
              fullPage: false,
            });
          }
        });
      }
    }
  });
}

for (const locale of ["fr", "ar"]) {
  test(`galeries ${locale} : chaque carte ouvre son illustration correspondante`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`/${locale}/themes`);
    const cartesThemes = page.locator('main ul[aria-label] > li > a');
    await expect(cartesThemes).toHaveCount(themes.length);
    for (const theme of themes) {
      const carte = cartesThemes.filter({ has: page.locator(`img[src*="${encodeURIComponent(imageTheme(theme.id))}"]`) });
      await expect(carte).toHaveAttribute("href", `/${locale}/themes/${theme.id}`);
      await page.goto(`/${locale}/themes/${theme.id}`);
      await expect(page.locator("main img").first()).toHaveAttribute("src", new RegExp(encodeURIComponent(imageTheme(theme.id))));
      await page.goto(`/${locale}/themes`);
    }
    await page.goto(`/${locale}/chapitres`);
    const cartesChapitres = page.locator('main ul[aria-label] > li > a');
    await expect(cartesChapitres).toHaveCount(chapitres.length);
    for (const chapitre of chapitres) {
      const lien = page.locator(`main ul[aria-label] > li > a[href="/${locale}/chapitres/${chapitre.id}"]`);
      await expect(lien).toBeVisible();
      await lien.click();
      await expect(page).toHaveURL(new RegExp(`/chapitres/${chapitre.id}$`));
      await expect(page.locator(`main img[src*="${encodeURIComponent(`/images/hd/${chapitre.image}.png`)}"]`)).toBeVisible();
      await page.goto(`/${locale}/chapitres`);
    }
  });
}
