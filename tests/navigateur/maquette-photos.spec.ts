import {expect,test} from "@playwright/test";

test("l'accueil charge le panorama photo et les huit photos du catalogue",async({page,request})=>{
 const paths=["/illustrations/maquette-hero-photo.svg","/illustrations/chapitres-photos-reference.svg"];
 for(const path of paths){
  const response=await request.get(path);
  expect(response.status()).toBe(200);
  const source=await response.text();
  expect(source).toMatch(/data:image\/webp;base64,/);
  expect(source.length).toBeGreaterThan(4000);
 }
 await page.goto("/fr");
 const heros=page.locator("section[aria-label='Bibliothèque de hadiths']");
 await expect(heros).toBeVisible();
 const fond=await heros.evaluate(el=>getComputedStyle(el).backgroundImage);
 expect(fond).toContain("maquette-hero-photo.svg");
 const cartes=page.locator('button[data-chapitre]');
 await expect(cartes).toHaveCount(8);
 const photo=await cartes.first().evaluate(el=>getComputedStyle(el).backgroundImage);
 expect(photo).toContain("chapitres-photos-reference.svg");
});
test("photo de la fontaine et option sonore sur purification",async({page})=>{
 await page.goto("/fr/themes");
 const fontaine=page.locator('button[data-chapitre="purification"]');
 await expect(fontaine).toBeVisible();
 await expect(fontaine.locator('[class*="fontaineAnimee"]')).toHaveCount(1);
 const bouton=page.getByRole("button",{name:/Activer les ambiances sonores/});
 await expect(bouton).toHaveAttribute("aria-pressed","false");
});
