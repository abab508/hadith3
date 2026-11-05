import { afterEach, describe, expect, it } from "vitest";
import { depotMemoire, saisieContenu, slugDe } from "@/lib/contenus/depot";
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
