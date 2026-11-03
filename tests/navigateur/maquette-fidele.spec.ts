import {expect,test} from "@playwright/test";

test("la page d'accueil affiche la même scène thématique que la page Thèmes",async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto("/fr");
 await expect(page.locator("header nav")).toHaveCount(1);
 await expect(page.getByRole("heading",{name:"Les grands chapitres de l’islam"})).toBeVisible();
 await expect(page.locator("button[aria-pressed]")).toHaveCount(8);
 await expect(page.locator('a[hreflang="fr"]')).toBeVisible();
 await expect(page.locator('a[hreflang="ar"]')).toBeVisible();
 await expect(page.locator('a[hreflang="en"]')).toBeVisible();
 await expect(page.getByRole("button",{name:/Mariage et famille/})).toHaveAttribute("aria-pressed","true");
 const scene=page.locator('section[aria-label="Bibliothèque de hadiths"]').first();
 await expect(scene).toBeVisible();
 await expect(scene.getByRole("searchbox")).toBeVisible();
 await page.goto("/fr/themes");
 await expect(page.locator("button[aria-pressed]")).toHaveCount(8);
 await expect(page.getByRole("heading",{name:"Les grands chapitres de l’islam"})).toBeVisible();
});

test("les sections secondaires et les langues restent accessibles sans charger seize cartes",async({page})=>{
 await page.goto("/fr");
 const plus=page.locator("header nav details summary");
 await plus.click();
 await expect(page.getByRole("link",{name:"Glossaire"})).toBeVisible();
 await expect(page.locator('header a[hreflang="ur"]')).toBeVisible();
 await page.getByRole("button",{name:/Voir les 16 grands chapitres/}).click();
 await expect(page.locator("button[aria-pressed]")).toHaveCount(16);
 await page.getByRole("button",{name:/Justice, société et gouvernance/}).click();
 await expect(page.locator("button[aria-pressed='true']")).toContainText("Justice");
});

test("interface mobile, boutons visibles et navigation sans débordement majeur",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/fr");
 await expect(page.getByRole("heading",{name:"Les grands chapitres de l’islam"})).toBeVisible();
 await expect(page.locator(".prestige-banniere")).toHaveCount(0);
 await expect(page.getByRole("button",{name:/Mariage et famille/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Voir les 16 grands chapitres/})).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(overflow).toBeLessThan(8);
});

test("le décor référencé est hébergé localement sur le site",async({request})=>{
 const art=await request.get("/illustrations/maquette-hero-ornement.svg");
 expect(art.ok()).toBe(true);
 const source=await art.text();
 expect(source).toContain("<svg");
 expect(source).toContain("Lantern");
 expect(source).toContain("Mosque");
});
