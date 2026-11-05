import { afterEach, describe, expect, it } from "vitest";
import { depotMemoire, languesContenu, saisieContenu, slugDe } from "@/lib/contenus/depot";
import { catalogue } from "@/donnees/catalogue";
import { creerSession, motDePasseValide, sessionValide } from "@/lib/admin-auth";
import { POST as creer } from "@/app/api/admin/contenus/route";
import { POST as connexion } from "@/app/api/admin/session/route";

const saisie = (titre: string, publie = true) => saisieContenu.parse({ type: "article", titre, langue: "fr", corps: "Texte", publie });

describe("contenus de l'administrateur", () => {
  it("fabrique une adresse lisible, en lettres latines ou arabes", () => {
    expect(slugDe("Le mois de Ramaḍān : repères")).toBe("le-mois-de-ramadan-reperes");
    expect(slugDe("شهر رمضان")).toBe("شهر-رمضان");
    expect(slugDe("!!!")).toBe("contenu");
  });

  it("refuse un contenu incomplet ou un PDF qui n'est pas en https", () => {
    expect(saisieContenu.safeParse({ type: "article", titre: "ab", langue: "fr" }).success).toBe(false);
    expect(saisieContenu.safeParse({ type: "fatwa", titre: "Titre", langue: "fr" }).success).toBe(false);
    expect(saisieContenu.safeParse({ type: "article", titre: "Titre", langue: "fr", pdfUrl: "http://x.test/a.pdf" }).success).toBe(false);
  });

  it("prend les langues d'écriture dans le catalogue des langues", () => {
    const actives = catalogue.entrees.filter((e) => e.statut !== "desactivee").map((e) => e.tag);
    expect(languesContenu()).toEqual(actives);
    for (const tag of actives) expect(saisieContenu.safeParse({ type: "article", titre: "Titre", langue: tag }).success).toBe(true);
    expect(saisieContenu.safeParse({ type: "article", titre: "Titre", langue: "xx" }).success).toBe(false);
  });

  it("montre tous les contenus à l'admin, sans limite", async () => {
    const d = depotMemoire();
    for (let i = 0; i < 520; i++) await d.creer(saisie(`Contenu ${i}`, i % 2 === 0));
    expect((await d.lister()).length).toBe(520);
    expect((await d.lister({ publiesSeulement: true, limite: 200 })).length).toBe(200);
  });

  it("crée, liste, modifie et supprime ; les brouillons restent cachés", async () => {
    const d = depotMemoire();
    const a = await d.creer(saisie("Premier article"));
    const b = await d.creer(saisie("Premier article", false));
    expect(b.slug).toBe("premier-article-2");
    expect((await d.lister({ publiesSeulement: true })).map((c) => c.id)).toEqual([a.id]);
    const m = await d.modifier(b.id, saisie("Premier article", true));
    expect(m?.publieLe).not.toBeNull();
    expect(await d.supprimer(a.id)).not.toBeNull();
    expect(await d.lireParId(a.id)).toBeNull();
  });
});

describe("connexion de l'administrateur", () => {
  const avant = { ...process.env };
  afterEach(() => { process.env = { ...avant }; });
  const configurer = () => {
    process.env.HADITH_ADMIN_PASSWORD = "mot-de-passe-de-test-1234";
    process.env.HADITH_IMPORT_SESSION_SECRET = "secret-de-test-de-session-32-caracteres!";
  };

  it("vérifie le mot de passe et la signature de la session", () => {
    configurer();
    expect(motDePasseValide("mot-de-passe-de-test-1234")).toBe(true);
    expect(motDePasseValide("faux")).toBe(false);
    const s = creerSession();
    expect(sessionValide(s)).toBe(true);
    expect(sessionValide(s.slice(0, -1) + (s.endsWith("0") ? "1" : "0"))).toBe(false);
  });

  it("refuse d'écrire sans session, et refuse une requête venue d'un autre site", async () => {
    configurer();
    const sansSession = await creer(new Request("http://site.test/api/admin/contenus", {
      method: "POST", headers: { origin: "http://site.test", "content-type": "application/json" }, body: JSON.stringify({}),
    }));
    expect(sansSession.status).toBe(401);
    const autreSite = await connexion(new Request("http://site.test/api/admin/session", {
      method: "POST", headers: { origin: "http://pirate.test" }, body: JSON.stringify({ motDePasse: "mot-de-passe-de-test-1234" }),
    }));
    expect(autreSite.status).toBe(403);
  });
});

describe("PDF en stockage privé", async () => {
  const { accesPdf, lienPdf, stockagePdf, urlPdfValide } = await import("@/lib/contenus/pdf");
  const { GET } = await import("@/app/api/pdf/route");
  const avant = { ...process.env };
  afterEach(() => { process.env = { ...avant }; });

  it("n'accepte que les PDF de contenus dans notre stockage", () => {
    expect(urlPdfValide("https://abc.private.blob.vercel-storage.com/contenus/guide-x1.pdf")).toBe(true);
    expect(urlPdfValide("https://abc.private.blob.vercel-storage.com/autre/guide.pdf")).toBe(false);
    expect(urlPdfValide("https://pirate.test/contenus/guide.pdf")).toBe(false);
    expect(urlPdfValide("http://abc.private.blob.vercel-storage.com/contenus/guide.pdf")).toBe(false);
    expect(accesPdf("https://abc.private.blob.vercel-storage.com/contenus/a.pdf")).toBe("private");
    expect(lienPdf("https://a.b/c d.pdf")).toBe("/api/pdf?u=https%3A%2F%2Fa.b%2Fc%20d.pdf");
  });

  it("reconnaît le stockage branché par Vercel (BLOB_STORE_ID) ou par jeton", () => {
    delete process.env.BLOB_STORE_ID; delete process.env.BLOB_READ_WRITE_TOKEN;
    expect(stockagePdf()).toBe(false);
    process.env.BLOB_STORE_ID = "store_test";
    expect(stockagePdf()).toBe(true);
  });

  it("refuse de servir un PDF qui n'appartient à aucun contenu publié", async () => {
    process.env.BLOB_STORE_ID = "store_test";
    const r = await GET(new Request(`http://site.test${lienPdf("https://abc.private.blob.vercel-storage.com/contenus/secret.pdf")}`));
    expect(r.status).toBe(404);
  });
});
