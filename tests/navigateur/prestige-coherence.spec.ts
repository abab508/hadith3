import {expect,test} from "@playwright/test";

test("menus communs et identité visuelle sur les pages documentaires FR",async({page})=>{
  for(const path of ["/fr/recherche","/fr/rapport/niyyat","/fr/chaine","/fr/glossaire","/fr/langues","/fr/sources","/fr/memorisation","/fr/parametres"]){
    await page.goto(path);
    await expect(page.locator("header nav").first()).toBeVisible();
    await expect(page.locator("header nav a[href='/fr/themes']").first()).toBeVisible();
    await expect(page.locator(".prestige-banniere")).toHaveCount(1);
    await expect(page.locator(".prestige-marque")).toContainText("Milaghaiba");
  }
});

test("recherche et rapport gardent leurs contenus et navigation",async({page})=>{
  await page.goto("/fr/recherche?q=intentions");
  await expect(page.getByRole("heading",{name:"Résultats"})).toBeVisible();
  await expect(page.locator("form[role='search']")).toBeVisible();
  await page.goto("/fr/rapport/niyyat");
  await expect(page.locator(".prestige-banniere")).toBeVisible();
  await expect(page.locator("p[lang='ar'][dir='rtl']").first()).toBeVisible();
  await expect(page.getByRole("link",{name:/Rechercher par chaîne/}).first()).toBeVisible();
});

test("arabe RTL et thème clair continuent de fonctionner",async({page})=>{
  await page.goto("/ar/glossaire");
  await expect(page.locator("html")).toHaveAttribute("dir","rtl");
  await expect(page.locator(".prestige-nom-ar")).toHaveAttribute("dir","rtl");
  await expect(page.locator("header a[hreflang='fr']")).toBeVisible();
});

test("décors servis localement et illustration justice sans statue",async({request})=>{
  const decor=await request.get("/illustrations/prestige-panorama.svg");
  expect(decor.status()).toBe(200);
  expect(await decor.text()).toContain("<svg");
  const justice=await request.get("/illustrations/justice-balance.svg");
  expect(justice.status()).toBe(200);
  const svg=await justice.text();
  expect(svg).toContain("<svg");
  expect(svg).not.toMatch(/statue|lady.?justice/i);
});
