import {expect,test} from "@playwright/test";
test("navigation par grands chapitres en français",async({page})=>{
 await page.goto("/fr");
 await page.getByRole("link",{name:/Découvrir les 16 grands chapitres/}).click();
 await expect(page).toHaveURL(/\/fr\/themes$/);
 await expect(page.locator('main .Themes_grille__placeholder')).toHaveCount(0);
 await expect(page.getByRole("heading",{level:2})).toHaveCount(16);
 await page.getByRole("link",{name:/Mariage, famille et vie conjugale/}).click();
 await expect(page).toHaveURL(/\/fr\/themes\/famille$/);
 await expect(page.getByRole("heading",{name:"Mariage et contrat"})).toBeVisible();
 await page.getByRole("link",{name:/Rechercher/}).first().click();
 await expect(page).toHaveURL(/\/fr\/recherche\?q=/);
});
test("catalogue en arabe RTL",async({page})=>{
 await page.goto("/ar/themes");
 await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 await expect(page.getByRole("heading",{name:"الأبواب الكبرى في الإسلام"})).toBeVisible();
 await page.getByRole("link",{name:/النكاح والأسرة/}).click();
 await expect(page).toHaveURL(/\/ar\/themes\/famille$/);
 await expect(page.getByRole("heading",{name:"النكاح والعقد"})).toBeVisible();
});
test("un chapitre inconnu renvoie 404",async({page})=>{
 const response=await page.goto("/fr/themes/chapitre-inexistant");
 expect(response?.status()).toBe(404);
});
