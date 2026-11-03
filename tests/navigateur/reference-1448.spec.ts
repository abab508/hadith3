import {expect,test} from "@playwright/test";

test("référence desktop : menu sur le panorama, quatre cartes par rangée",async({page})=>{
 await page.setViewportSize({width:1448,height:1086});
 await page.goto("/fr/themes");
 const entete=page.locator("header").first();
 const hero=page.locator("section[aria-label='Bibliothèque de hadiths']");
 await expect(entete).toBeVisible();
 await expect(hero).toBeVisible();
 const nav=await entete.boundingBox();
 const bann=await hero.boundingBox();
 expect(nav).not.toBeNull();
 expect(bann).not.toBeNull();
 expect(nav!.y).toBeLessThan(bann!.y+bann!.height*.4);
 const cartes=page.locator("button[data-chapitre]");
 await expect(cartes).toHaveCount(8);
 const positions=await Promise.all([0,1,2,3,4].map(i=>cartes.nth(i).boundingBox()));
 expect(positions.every(Boolean)).toBe(true);
 expect(Math.abs(positions[0]!.y-positions[3]!.y)).toBeLessThan(3);
 expect(positions[4]!.y).toBeGreaterThan(positions[0]!.y+50);
 await expect(page.getByRole("button",{name:/Croyance et foi/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Purification/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Mariage et famille/})).toHaveAttribute("aria-pressed","true");
});
