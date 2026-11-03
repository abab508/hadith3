import {expect,test} from "@playwright/test";

test("la fontaine et les ambiances sont proposées avec le son désactivé",async({page})=>{
 await page.goto("/fr/themes");
 const fontaine=page.locator('button[data-chapitre="purification"]');
 await expect(fontaine).toBeVisible();
 await expect(fontaine.locator("span")).not.toHaveCount(0);
 const activer=page.getByRole("button",{name:/Activer les ambiances sonores/});
 await expect(activer).toHaveAttribute("aria-pressed","false");
 await fontaine.hover();
 await expect(fontaine).toBeVisible();
 await activer.click();
 await expect(page.getByRole("button",{name:/Couper les ambiances sonores/})).toHaveAttribute("aria-pressed","true");
 await fontaine.hover();
 await page.getByRole("button",{name:/Couper les ambiances sonores/}).click();
 await expect(activer).toHaveAttribute("aria-pressed","false");
});
test("en arabe le contrôle audio demeure compréhensible et RTL",async({page})=>{
 await page.goto("/ar/themes");
 await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 await expect(page.getByRole("button",{name:/تفعيل المؤثرات الصوتية/})).toBeVisible();
});
test("la réduction du mouvement respecte le choix système",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/fr/themes");
 const fontaine=page.locator('button[data-chapitre="purification"]');
 await fontaine.hover();
 await expect(fontaine).toBeVisible();
 const animation=await fontaine.locator('[class*="fontaineAnimee"] span').first().evaluate(el=>getComputedStyle(el).animationName);
 expect(animation).toBe("none");
});
