import { expect, test } from "@playwright/test";
import ar from "../../messages/ar.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };
import { entree } from "@/donnees/catalogue";

// Échantillon demandé par l'audit : une interface RTL et une interface LTR.
const interfaces = [{ tag: "ar", messages: ar }, { tag: "fr", messages: fr }];
const pages = ["", "/glossaire", "/parametres", "/langues", "/page-inexistante-mis009"];

for (const { tag, messages } of interfaces) {
  for (const chemin of pages) {
    test(`${tag}${chemin || "/"} : repères, titres et évitement au clavier`, async ({ page }) => {
      const reponse = await page.goto(`/${tag}${chemin}`);
      if (chemin === "/page-inexistante-mis009") {
        expect(reponse?.status()).toBe(404);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.introuvable.titre);
      }
      await expect(page.locator("html")).toHaveAttribute("lang", tag);
      await expect(page.locator("html")).toHaveAttribute("dir", entree(tag)!.direction);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("navigation")).toHaveCount(1);
      const niveaux = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll(
        (titres) => titres.map((titre) => Number(titre.tagName.slice(1))),
      );
      for (let index = 1; index < niveaux.length; index++) {
        expect(niveaux[index]!).toBeLessThanOrEqual(niveaux[index - 1]! + 1);
      }

      await page.keyboard.press("Tab");
      const evitement = page.getByRole("link", { name: messages.commun.allerAuContenu, exact: true });
      await expect(evitement).toBeFocused();
      await expect(evitement).toBeVisible();
      expect(await evitement.evaluate((lien) => getComputedStyle(lien).clipPath)).toBe("none");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("main")).toBeFocused();
    });
  }

  test(`${tag} : infobulle accessible au clavier et fermable avec Échap`, async ({ page }) => {
    await page.goto(`/${tag}`);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    // Refonte 2026-11-04 : le bouton de la scène d'accueil précède le terme ; on avance au clavier jusqu'à lui.
    const terme = page.locator('button[data-terme="hasan"]');
    for (let i = 0; i < 6 && !(await terme.evaluate((b) => b === document.activeElement)); i++) {
      await page.keyboard.press("Tab");
    }
    await expect(terme).toBeFocused();
    await expect(terme).toHaveAttribute("aria-expanded", "true");
    await expect(terme).toHaveAccessibleName(/ḥasan/);
    await expect(terme).toHaveAccessibleDescription(new RegExp(messages.terme.aValider));
    const infobulle = page.getByRole("tooltip");
    await expect(infobulle).toBeVisible();
    await expect(infobulle).toContainText(messages.terme.aValider);
    const focus = await terme.evaluate((bouton) => {
      const style = getComputedStyle(bouton);
      return { epaisseur: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(focus.epaisseur).toBeGreaterThanOrEqual(2);
    expect(focus.style).toBe("solid");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toBeHidden();
    await expect(terme).toBeFocused();
    await expect(terme).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Tab");
    await expect(page.locator("main a:focus")).toHaveCount(1);
  });

  test(`${tag} : l'infobulle reste accessible au survol de son contenu`, async ({ page }) => {
    await page.goto(`/${tag}`);
    await page.locator('button[data-terme="hasan"]').hover();
    const infobulle = page.getByRole("tooltip");
    await expect(infobulle).toBeVisible();
    await infobulle.hover();
    await expect(infobulle).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(infobulle).toBeHidden();
  });
}

test.describe("infobulle au toucher", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  for (const { tag } of interfaces) {
    test(`${tag} : appui, fermeture et appui en dehors`, async ({ page }) => {
      await page.goto(`/${tag}`);
      const terme = page.locator('button[data-terme="hasan"]');
      await terme.tap();
      await expect(page.getByRole("tooltip")).toBeVisible();
      const cible = await terme.boundingBox();
      expect(cible?.width).toBeGreaterThanOrEqual(44);
      expect(cible?.height).toBeGreaterThanOrEqual(44);
      await terme.tap();
      await expect(page.getByRole("tooltip")).toBeHidden();
      await terme.tap();
      await expect(page.getByRole("tooltip")).toBeVisible();
      await page.getByRole("heading", { level: 1 }).tap();
      await expect(page.getByRole("tooltip")).toBeHidden();
    });
  }
});

test.describe("racine avant redirection, sans JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("un titre, un contenu et un lien d'évitement utilisable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: ar.commun.allerAuContenu, exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });
});
