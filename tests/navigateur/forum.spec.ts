import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import fr from "../../messages/fr.json" with { type: "json" };
import { JOURNAL_COURRIELS } from "../../playwright.config";
import { normaliserTexte } from "../../src/lib/forum/filtre";

// Serveur de test : dépôt en mémoire et mot de passe d'essai (playwright.config.ts).
const MDP_ADMIN = "mot-de-passe-de-test-1234";
const A = fr.adminForum, F = fr.forum, C = fr.compte;

test("invitation, inscription, discussion, message retenu puis publié par l'admin", async ({ browser }) => {
  const unique = Date.now().toString(36);
  const motInterdit = `interdit${unique}`;
  const admin = await (await browser.newContext()).newPage();
  const membre = await (await browser.newContext()).newPage();

  // 1. L'admin crée un code d'invitation et un mot interdit.
  await admin.goto("/fr/admin/forum");
  await admin.getByLabel(A.motDePasse).fill(MDP_ADMIN);
  await admin.getByRole("button", { name: A.seConnecter }).click();
  await admin.getByRole("tab", { name: A.onglets.invitations }).click();
  await admin.getByLabel(A.note).fill(`note-${unique}`);
  await admin.getByRole("button", { name: A.creerCode }).click();
  // On attend le code de CETTE invitation : « le premier de la liste » peut être un ancien code déjà utilisé.
  const code = (await admin.locator("li[data-invitation]", { hasText: `note-${unique}` }).getAttribute("data-invitation"))!;
  expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  await admin.getByRole("tab", { name: A.onglets.mots }).click();
  await admin.getByLabel(A.mot).fill(motInterdit);
  await admin.getByRole("button", { name: A.ajouterMot }).click();
  // La liste montre le mot normalisé : un « yy » tiré au hasard dans `unique` devient « y ».
  await expect(admin.getByText(normaliserTexte(motInterdit))).toBeVisible();

  // 2. Le membre s'inscrit avec le code et ouvre une discussion.
  await membre.goto("/fr/compte");
  await membre.getByRole("tab", { name: C.inscription }).click();
  await membre.getByLabel(C.code).fill(code);
  await membre.getByLabel(C.email).fill(`membre-${unique}@exemple.test`);
  await membre.getByLabel(C.nom).fill(`Membre ${unique}`);
  await membre.getByLabel(C.motDePasse).fill("un-mot-de-passe-solide");
  await membre.getByRole("button", { name: C.creer }).click();
  await expect(membre.getByText(C.connecte.replace("{nom}", `Membre ${unique}`))).toBeVisible();

  await membre.goto("/fr/forum/nouveau");
  await membre.getByLabel(F.champTitre).fill(`Discussion d'essai ${unique}`);
  await membre.getByLabel(F.champTexte).fill("Premier message, sans mot interdit.");
  await membre.getByRole("button", { name: F.publier }).click();
  await expect(membre).toHaveURL(/\/fr\/forum\/\d+$/);
  await expect(membre.getByRole("heading", { level: 1 })).toHaveText(`Discussion d'essai ${unique}`);

  // 3. Une réponse avec le mot interdit est retenue.
  await membre.getByLabel(F.votreReponse).fill(`Réponse avec ${motInterdit} dedans.`);
  await membre.getByRole("button", { name: F.repondre }).click();
  await expect(membre.getByText(F.retenu)).toBeVisible();
  await expect(membre.getByText(F.enAttente)).toBeVisible();

  // 4. L'admin la voit dans les messages retenus et la publie.
  await admin.reload();
  await admin.getByRole("tab", { name: /Messages retenus/ }).click();
  const retenu = admin.locator("li[data-retenu]").filter({ hasText: motInterdit });
  await expect(retenu).toBeVisible();
  await retenu.getByRole("button", { name: A.publier }).click();
  await expect(retenu).toHaveCount(0);

  await membre.reload();
  await expect(membre.getByText(`Réponse avec ${motInterdit} dedans.`)).toBeVisible();
  await expect(membre.getByText(F.enAttente)).toHaveCount(0);
});

test("sans compte, le forum invite à se connecter et le menu y mène", async ({ page }) => {
  await page.goto("/fr");
  await page.locator("header").getByRole("link", { name: fr.navigation.forum, exact: true }).first().click();
  await expect(page).toHaveURL(/\/fr\/forum$/);
  await expect(page.getByRole("heading", { level: 2, name: F.regles.titre })).toBeVisible();
  await expect(page.getByRole("link", { name: F.connecter })).toBeVisible();
});

test("un mauvais mot de passe membre est refusé sans dire si l'e-mail existe", async ({ page }) => {
  await page.goto("/fr/compte");
  await page.getByLabel(C.email).fill("inconnu@exemple.test");
  await page.getByLabel(C.motDePasse).fill("pas-le-bon-mot-de-passe");
  await page.getByRole("button", { name: C.seConnecter }).click();
  await expect(page.getByText(C.erreurs.identifiants)).toBeVisible();
});

test("l'œil affiche le mot de passe, l'e-mail peut être retenu, « mot de passe oublié » explique quoi faire", async ({ page }) => {
  await page.goto("/fr/compte");
  const mdp = page.getByLabel(C.motDePasse, { exact: true });
  await mdp.fill("secret-a-voir");
  await expect(mdp).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: C.afficherCaracteres }).click();
  await expect(mdp).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: C.masquerCaracteres }).click();
  await expect(mdp).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: C.oublie }).click();
  await expect(page.getByRole("button", { name: C.recevoirLien })).toBeVisible();

  // L'adresse n'est retenue qu'après une connexion réussie : on simule une adresse déjà retenue.
  await page.evaluate(() => localStorage.setItem("milaghaiba_email", "retenu@exemple.test"));
  await page.reload();
  await expect(page.getByLabel(C.email)).toHaveValue("retenu@exemple.test");
  await expect(page.getByLabel(C.souvenir)).toBeChecked();
});

test("mot de passe oublié : lien par e-mail, nouveau mot de passe, lien utilisable une seule fois", async ({ browser }) => {
  const unique = Date.now().toString(36);
  const email = `oubli-${unique}@exemple.test`;
  const admin = await (await browser.newContext()).newPage();
  await admin.goto("/fr/admin/forum");
  await admin.getByLabel(A.motDePasse).fill(MDP_ADMIN);
  await admin.getByRole("button", { name: A.seConnecter }).click();
  await admin.getByRole("tab", { name: A.onglets.invitations }).click();
  await admin.getByLabel(A.note).fill(`note-${unique}`);
  await admin.getByRole("button", { name: A.creerCode }).click();
  // On attend le code de CETTE invitation (un autre test peut en créer en même temps).
  const code = (await admin.locator("li[data-invitation]", { hasText: `note-${unique}` }).getAttribute("data-invitation"))!;

  const page = await (await browser.newContext()).newPage();
  await page.goto("/fr/compte");
  await page.getByRole("tab", { name: C.inscription }).click();
  await page.getByLabel(C.code).fill(code);
  await page.getByLabel(C.email).fill(email);
  await page.getByLabel(C.nom).fill(`Oubli ${unique}`);
  await page.getByLabel(C.motDePasse).fill("ancien-mot-de-passe");
  await page.getByRole("button", { name: C.creer }).click();
  await page.getByRole("button", { name: C.deconnexion }).click();

  // Demande du lien : même réponse pour une adresse connue ou inconnue.
  await page.getByRole("button", { name: C.oublie }).click();
  const champ = page.locator("form", { has: page.getByRole("button", { name: C.recevoirLien }) }).getByLabel(C.email);
  await champ.fill(email);
  await page.getByRole("button", { name: C.recevoirLien }).click();
  await expect(page.getByText(C.lienEnvoye)).toBeVisible();

  const lignes = (await readFile(JOURNAL_COURRIELS, "utf8")).trim().split("\n").map((l) => JSON.parse(l) as { a: string; texte: string });
  const courriel = lignes.reverse().find((c) => c.a === email)!;
  const lien = courriel.texte.match(/https?:\/\/\S+/)![0];
  expect(lien).toContain("/fr/compte/nouveau-mot-de-passe#");

  await page.goto(new URL(lien).pathname + new URL(lien).hash);
  await expect(page).not.toHaveURL(/#/);
  await page.getByLabel(C.nouveau).fill("nouveau-mot-de-passe");
  await page.getByRole("button", { name: C.enregistrer }).click();
  await expect(page.getByText(C.mdpReinitialise)).toBeVisible();

  // Le même lien ne sert plus.
  await page.goto("/fr/compte");
  await page.goto(new URL(lien).pathname + new URL(lien).hash);
  await page.getByLabel(C.nouveau).fill("encore-un-autre-mdp");
  await page.getByRole("button", { name: C.enregistrer }).click();
  await expect(page.getByText(C.erreurs.jeton)).toBeVisible();

  // Connexion avec le nouveau mot de passe.
  await page.goto("/fr/compte");
  await page.getByLabel(C.email).fill(email);
  await page.getByLabel(C.motDePasse, { exact: true }).fill("nouveau-mot-de-passe");
  await page.getByRole("button", { name: C.seConnecter }).click();
  await expect(page.getByText(C.connecte.replace("{nom}", `Oubli ${unique}`))).toBeVisible();
});
