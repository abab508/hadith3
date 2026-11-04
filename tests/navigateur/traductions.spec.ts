import { expect, test } from "@playwright/test";
import es from "../../messages/es.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };

// Exigence 03 §9 : l'original arabe reste séparé de toute traduction, et chaque traduction dit d'où elle vient.

test("rapport fr : l'original arabe est séparé de la traduction automatique, signalée comme telle", async ({ page }) => {
  await page.goto("/fr/rapport/niyyat");
  const section = page.locator('section[aria-labelledby="titre-original"]');
  const original = section.locator('p[lang="ar"][dir="rtl"]');
  await expect(original).toHaveCount(1);
  await expect(original).toContainText("إِنَّمَا الأَعْمَالُ");
  const traduction = section.locator('[data-origine="ia"]');
  await expect(traduction).toHaveCount(1);
  // La traduction est dans son propre bloc, pas dans le paragraphe arabe.
  await expect(traduction.locator('p[lang="fr"]')).toHaveCount(1);
  await expect(original.locator('[lang="fr"]')).toHaveCount(0);
  await expect(traduction).toContainText(fr.recherche.traduction.ia);
});

test("rapport es : sans traduction espagnole, le statut « original non traduit » est affiché et rien n'est inventé", async ({ page }) => {
  await page.goto("/es/rapport/niyyat");
  const section = page.locator('section[aria-labelledby="titre-original"]');
  await expect(section.locator('p[lang="ar"][dir="rtl"]')).toHaveCount(1);
  await expect(section.locator('[data-origine="original-non-traduit"]')).toHaveText(es.recherche.traduction.originalNonTraduit);
  await expect(section.locator('p[lang="es"]')).toHaveCount(0);
  await expect(section.locator('[data-origine="ia"]')).toHaveCount(0);
});

test("textes mixtes en arabe : noms latins isolés en LTR, chiffres et arabe non inversés", async ({ page }) => {
  await page.goto("/ar/rapport/niyyat");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  // Chaque nom translittéré (latin + caractères combinés) est isolé dans un bloc LTR.
  const latins = page.locator('#fiche-transmetteur [lang="ar-Latn"], section[aria-labelledby="titre-isnad"] [lang="ar-Latn"]');
  expect(await latins.count()).toBeGreaterThan(3);
  for (const element of await latins.all()) await expect(element).toHaveAttribute("dir", "ltr");
  // Le texte arabe est stocké et affiché tel quel (NFC, jamais inversé à la main).
  const original = await page.locator('section[aria-labelledby="titre-original"] p[lang="ar"]').first().textContent();
  expect(original).toBe(original?.normalize("NFC"));
  expect(original?.trimStart().startsWith("إِنَّمَا")).toBe(true);
  // Les noms latins gardent leurs lettres diacritées (ḥ, ṣ, ā…).
  await expect(page.locator('#fiche-transmetteur [lang="ar-Latn"]').first()).toHaveText("Yaḥyā ibn Saʿīd al-Anṣārī");
});
