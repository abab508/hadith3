import {expect,test} from "@playwright/test";

test("accueil → catalogue → mariage → sous-thèmes en français",async({page})=>{
 await page.goto("/fr");
 await expect(page.getByRole("heading",{name:"Les grands chapitres de l’islam"})).toBeVisible();
 await page.getByRole("link",{name:/Thèmes/}).first().click();
 await expect(page).toHaveURL(/\/fr\/themes$/);
 await expect(page.getByRole("heading",{name:"Les grands chapitres de l’islam"})).toBeVisible();
 const cartes=page.locator("button[data-chapitre]");
 await expect(cartes).toHaveCount(8);
 await page.getByRole("button",{name:/Voir les 16 grands chapitres/}).click();
 await expect(cartes).toHaveCount(16);
 const famille=page.getByRole("button",{name:/Mariage et famille/});
 await famille.click();
 await expect(famille).toHaveAttribute("aria-pressed","true");
 await expect(page.getByRole("heading",{name:"Mariage et famille"}).last()).toBeVisible();
 await page.getByRole("link",{name:/Voir tous les sous-thèmes/}).click();
 await expect(page).toHaveURL(/\/fr\/themes\/famille$/);
 await expect(page.getByRole("heading",{name:"Mariage et contrat"})).toBeVisible();
 await page.getByRole("link",{name:/Rechercher/}).first().click();
 await expect(page).toHaveURL(/\/fr\/recherche\?q=/);
});

test("catalogue arabe RTL et navigation par chapitre",async({page})=>{
 await page.goto("/ar/themes");
 await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 await expect(page.getByRole("heading",{name:"الأبواب الكبرى في الإسلام"})).toBeVisible();
 await page.getByRole("button",{name:/الزواج والأسرة/}).click();
 await page.getByRole("link",{name:/عرض جميع الموضوعات/}).click();
 await expect(page).toHaveURL(/\/ar\/themes\/famille$/);
 await expect(page.getByRole("heading",{name:"النكاح والعقد"})).toBeVisible();
});

test("un chapitre inconnu renvoie 404",async({page})=>{
 const response=await page.goto("/fr/themes/chapitre-inexistant");
 expect(response?.status()).toBe(404);
});
