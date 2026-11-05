import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import brut from "../../data/chapitres/index.json" with { type: "json" };
import ar from "../../messages/ar.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };

type Chapitre = { theme: string; ar: string; fr: string | null; sous: { id: string; ar: string; fr: string | null }[] };
const catalogue = brut as unknown as { themes: Record<string, string[]>; chapitres: Record<string, Chapitre> };
const sujets: Record<string, string> = { croyance: "c3", adoration: "c38359", relations: "c48886", science: "c11954", "autres-themes": "c46937" };
const traductions = { ar, fr };

async function imageChargee(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element) => {
    const img = element as HTMLImageElement;
    return img.complete && img.naturalWidth > 0;
  })).toBe(true);
}

async function largeurStable(page: Page) {
  const dimensions = await page.evaluate(() => ({ contenu: document.documentElement.scrollWidth, ecran: document.documentElement.clientWidth }));
  expect(dimensions.contenu).toBeLessThanOrEqual(dimensions.ecran + 1);
}

test.describe("illustration agrandie sur écran 4K", () => {
  test.use({ viewport: { width: 3840, height: 2160 }, reducedMotion: "reduce" });
  test("charge assez de pixels pour la taille réellement affichée", async ({ page }) => {
    await page.goto("/fr/chapitres/c48886");
    await page.getByRole("button", { name: fr.chapitreKg.agrandirIllustration.replace("{n}", "1"), exact: true }).click();
    const image = page.getByRole("dialog").locator("img");
    await imageChargee(image);
    // naturalWidth d'une image à srcset est corrigé par la densité annoncée (largeur « w » demandée / place réservée) :
    // on mesure donc les pixels RÉELS du fichier chargé, en le relisant sans srcset.
    const dimensions = await image.evaluate(async (element) => {
      const img = element as HTMLImageElement;
      const reelle = new Image();
      reelle.src = img.currentSrc;
      await reelle.decode();
      return { pixels: reelle.naturalWidth, affichee: img.getBoundingClientRect().width * window.devicePixelRatio };
    });
    // Une vignette de 30rem réutilisée telle quelle ne suffit pas à une galerie de 90rem.
    expect(dimensions.pixels).toBeGreaterThanOrEqual(Math.floor(dimensions.affichee));
    await largeurStable(page);
  });
});

for (const locale of ["fr", "ar"] as const) {
  for (const [theme, ids] of Object.entries(catalogue.themes)) {
    const id = sujets[theme] ?? ids.find((candidat) => /^c\d+$/.test(candidat)) ?? ids[0]!;
    test(`${locale}/${theme} : les cartes illustrées ouvrent leur chapitre`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto(`/${locale}/themes/${theme}`);
      const cartes = page.locator('main a[href*="/chapitres/"]');
      expect(await cartes.count()).toBeGreaterThan(0);
      for (const carte of await cartes.all()) {
        const href = await carte.getAttribute("href");
        expect(href).toMatch(new RegExp(`^/${locale}/chapitres/[a-z0-9-]+$`));
        const cible = href!.split("/").at(-1)!;
        expect(catalogue.chapitres[cible]?.theme, href!).toBe(theme);
        await expect(carte.locator("img"), `Carte sans illustration : ${href}`).toHaveCount(1);
      }
      const carte = page.locator(`main a[href="/${locale}/chapitres/${id}"]`);
      await imageChargee(carte.locator("img"));
      await carte.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/chapitres/${id}$`));
      const chapitre = catalogue.chapitres[id]!;
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale === "fr" ? chapitre.fr ?? chapitre.ar : chapitre.ar);
      await imageChargee(page.locator('main [role="tabpanel"]:visible [data-motif] img').first());
      await largeurStable(page);
    });
  }

  test.describe(`galerie interactive ${locale} sur mobile`, () => {
    test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    test("clic et Entrée agrandissent, Échap et Fermer rendent le focus", async ({ page }) => {
      await page.goto(`/${locale}/chapitres/c48886`);
      const textes = traductions[locale].chapitreKg;
      const ouvrir = textes.agrandirIllustration.replace("{n}", "1");
      const bouton = page.getByRole("button", { name: ouvrir, exact: true });
      await imageChargee(bouton.locator("img"));
      const motif = await bouton.locator("[data-motif]").getAttribute("data-motif");
      await bouton.click();
      const dialogue = page.getByRole("dialog");
      await expect(dialogue).toBeVisible();
      await expect(dialogue).toHaveAccessibleName(/\S/);
      await expect(dialogue.locator("[data-motif]")).toHaveAttribute("data-motif", motif!);
      await imageChargee(dialogue.locator("img"));
      const cadre = await dialogue.boundingBox();
      expect(cadre).not.toBeNull();
      expect(cadre!.x).toBeGreaterThanOrEqual(0);
      expect(cadre!.x + cadre!.width).toBeLessThanOrEqual(391);
      await page.keyboard.press("Escape");
      await expect(dialogue).toBeHidden();
      await expect(bouton).toBeFocused();
      await bouton.press("Enter");
      await expect(dialogue).toBeVisible();
      await dialogue.getByRole("button", { name: textes.fermerIllustration, exact: true }).click();
      await expect(dialogue).toBeHidden();
      await expect(bouton).toBeFocused();
      await largeurStable(page);
    });

    test("croyance, famille, science et combat gardent images et titres dans l’écran", async ({ page }) => {
      test.setTimeout(90_000);
      for (const id of ["c3", "c48596", "c11954", "c38359"]) {
        await page.goto(`/${locale}/chapitres/${id}`);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await imageChargee(page.locator('main [role="tabpanel"]:visible [data-motif] img').first());
        await largeurStable(page);
      }
    });
  });

  test(`${locale} : sous-chapitres et recueils conservent leurs références`, async ({ page }) => {
    test.setTimeout(90_000);
    const id = "c3";
    const chapitre = catalogue.chapitres[id]!;
    const sous = chapitre.sous[0]!;
    const textes = traductions[locale];
    await page.goto(`/${locale}/chapitres/${id}`);
    await page.getByRole("tab", { name: textes.chapitre.references, exact: true }).click();
    const liensRecueils = page.locator('main [role="tabpanel"]:visible a');
    expect(await liensRecueils.count()).toBeGreaterThan(0);
    for (const lien of await liensRecueils.all()) await expect(lien).toHaveAttribute("href", new RegExp(`^/${locale}/(?:recherche\\?recueil=|recueil/)[a-z0-9-]+$`));
    await page.getByRole("tab", { name: textes.chapitre.hadiths, exact: true }).click();
    await page.locator(`main [role="tabpanel"]:visible a[href="/${locale}/chapitres/${id}/${sous.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/chapitres/${id}/${sous.id}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale === "fr" ? sous.fr ?? sous.ar : sous.ar);
    await imageChargee(page.locator("main [data-motif] img").first());
    const fichier = JSON.parse(readFileSync(join(process.cwd(), "data", "chapitres", "hadiths", `${id}.json`), "utf8")) as { sous: Record<string, Record<string, number[]>> };
    const attendus = new Set(Object.entries(fichier.sous[sous.id]!).flatMap(([base, numeros]) => {
      const [type, recueil] = base.split("/");
      return numeros.map((numero) => `/${locale}/${type === "h" ? `hadith/${recueil}/ara` : `recueil/${recueil}`}/${numero}`);
    }));
    const liens = page.locator(`main a[href^="/${locale}/hadith/"], main a[href^="/${locale}/recueil/"]`);
    expect(await liens.count()).toBeGreaterThan(0);
    for (const lien of await liens.all()) expect(attendus.has((await lien.getAttribute("href"))!), "Le lien doit conserver le recueil ET le numéro de la source").toBe(true);
    await largeurStable(page);
  });
}
