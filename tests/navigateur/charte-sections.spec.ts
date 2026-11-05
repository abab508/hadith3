import { expect, test } from "@playwright/test";
import fr from "../../messages/fr.json" with { type: "json" };

test("le menu conserve un contraste lisible en mode clair", async ({ page }) => {
  await page.goto("/fr/parametres");
  await page.getByRole("button", { name: fr.apparence.clair, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const contrastes = await page.getByRole("banner").evaluate((banner) => {
    const luminance = (couleur: string) => {
      const rgb = couleur.match(/[\d.]+/g)!.slice(0, 3).map((v) => Number(v) / 255);
      const lin = rgb.map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return .2126 * lin[0]! + .7152 * lin[1]! + .0722 * lin[2]!;
    };
    const fond = luminance(getComputedStyle(banner).backgroundColor);
    return [...banner.querySelectorAll("nav a")].map((lien) => {
      const texte = luminance(getComputedStyle(lien).color);
      return (Math.max(texte, fond) + .05) / (Math.min(texte, fond) + .05);
    });
  });
  expect(contrastes.length).toBeGreaterThan(0);
  for (const contraste of contrastes) expect(contraste).toBeGreaterThanOrEqual(4.5);
});

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
