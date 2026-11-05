import { expect, test } from "@playwright/test";
import fr from "../../messages/fr.json" with { type: "json" };
import ar from "../../messages/ar.json" with { type: "json" };

test("la bulle ouvre l'assistant, Échap le ferme et rend le focus", async ({ page }) => {
  await page.goto("/fr/bibliotheque");
  const bulle = page.getByRole("button", { name: fr.assistant.ouvrir });
  await expect(bulle).toBeVisible();
  await bulle.click();
  const fenetre = page.getByRole("dialog", { name: fr.assistant.titre });
  await expect(fenetre).toBeVisible();
  await expect(fenetre).toContainText(fr.assistant.rappel);
  await expect(page.getByLabel(fr.assistant.placeholder)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(fenetre).toHaveCount(0);
  await expect(page.getByRole("button", { name: fr.assistant.ouvrir })).toBeFocused();
});

test("sans clé API, une question reçoit le message « indisponible »", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("button", { name: fr.assistant.ouvrir }).click();
  await page.getByLabel(fr.assistant.placeholder).fill("Le hadith des intentions");
  await page.getByRole("button", { name: fr.assistant.envoyer }).click();
  await expect(page.locator('[data-assistant="fenetre"] li[data-role="assistant"]').last()).toContainText(fr.assistant.erreurs.indisponible);
});

test("en arabe, la bulle est en bas à gauche", async ({ page }) => {
  await page.goto("/ar");
  const bulle = page.getByRole("button", { name: ar.assistant.ouvrir });
  const boite = (await bulle.boundingBox())!;
  const largeur = page.viewportSize()!.width;
  expect(boite.x).toBeLessThan(largeur / 2);
});
