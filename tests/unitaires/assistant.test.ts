import { afterEach, describe, expect, it } from "vitest";
import { CHARTE } from "@/lib/assistant/charte";
import { DEFINITIONS_OUTILS, executerOutil } from "@/lib/assistant/outils";
import { POST } from "@/app/api/assistant/route";

const lire = async (nom: string, entree: unknown) => {
  const r = await executerOutil(nom, entree, "fr");
  return { ...r, json: r.erreur ? null : JSON.parse(r.contenu) };
};

describe("assistant : charte et outils", () => {
  it("garde les règles absolues de la charte", () => {
    expect(CHARTE).toContain("Ne jamais inventer.");
    expect(CHARTE).toContain("Je ne trouve pas ce texte dans les sources de Milaghaiba.");
    expect(CHARTE).toContain("Aucun avis religieux.");
    expect(DEFINITIONS_OUTILS.map((o) => o.name)).toEqual(["rechercher_hadith", "lire_rapport", "fiche_transmetteur", "definir_terme"]);
  });

  it("refuse une entrée d'outil invalide ou un outil inconnu", async () => {
    expect((await lire("rechercher_hadith", { requete: "" })).erreur).toBe(true);
    expect((await lire("lire_rapport", { recueil: "inconnu", numero: 1 })).erreur).toBe(true);
    expect((await lire("supprimer_tout", {})).erreur).toBe(true);
  });

  it("dit « aucun résultat » pour une fausse référence (Bukhārī n° 99999)", async () => {
    const r = await lire("rechercher_hadith", { requete: "99999", recueil: "sahih-bukhari" });
    expect(r.json).toEqual({ resultat: "aucun résultat" });
  });

  it("dit « aucun résultat » pour un texte inventé", async () => {
    const r = await lire("rechercher_hadith", { requete: "زقزقة الفيلة البنفسجية في سوق الكواكب" });
    expect(r.json).toEqual({ resultat: "aucun résultat" });
  });

  it("donne une définition du glossaire avec son lien", async () => {
    const r = await lire("definir_terme", { terme: "ḥasan" });
    expect(r.json.arabe).toBe("حسن");
    expect(r.json.page).toBe("/fr/glossaire#hasan");
  });

  it("donne la fiche d'Abū Hurayra avec le chemin de sa page", async () => {
    const r = await lire("fiche_transmetteur", { nom: "أبو هريرة" });
    expect(r.json.fiches.some((f: { page: string }) => f.page === "/fr/biographies/personne/4396")).toBe(true);
  });

  it("donne la chaîne d'un hadith analysé, ou dit qu'elle n'est pas encore analysée", async () => {
    const r = await lire("lire_rapport", { recueil: "sahih-bukhari", numero: 1 });
    expect(r.erreur).toBe(false);
    expect(r.json.rapport ?? r.json.page).toMatch(/^\/fr\/hadith\/sahih-bukhari\/ara\/1/);
    if (r.json.chaine) expect(r.json.chaine.length).toBeGreaterThan(1);
    else expect(r.json.note).toContain("pas encore analysée");
  });
});

describe("assistant : route API sans clé", () => {
  const cle = process.env.ANTHROPIC_API_KEY;
  afterEach(() => { if (cle === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = cle; });

  it("répond « indisponible » proprement quand la clé manque", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await POST(new Request("http://x/api/assistant", { method: "POST", body: JSON.stringify({ locale: "fr", messages: [{ role: "user", content: "salam" }] }) }));
    expect(r.status).toBe(503);
    expect(JSON.parse((await r.text()).trim())).toEqual({ t: "erreur", code: "indisponible" });
  });

  it("refuse un message trop long", async () => {
    process.env.ANTHROPIC_API_KEY = "test-sans-appel";
    const r = await POST(new Request("http://x/api/assistant", { method: "POST", headers: { "x-forwarded-for": "10.0.0.9" }, body: JSON.stringify({ locale: "fr", messages: [{ role: "user", content: "a".repeat(2000) }] }) }));
    expect(r.status).toBe(400);
  });
});

describe("assistant : voix adaptée à la langue", async () => {
  const { passages } = await import("@/composants/Assistant");
  it("lit l'arabe en arabe, l'ourdou en ourdou et le reste dans sa langue", () => {
    expect(passages("إنما الأعمال بالنيات", "fr")[0]!.langue).toBe("ar-SA");
    expect(passages("یہ حدیث صحیح بخاری میں ہے", "ur")[0]!.langue).toBe("ur-PK");
    expect(passages("Le texte arabe est à la page indiquée.", "en")[0]!.langue).toBe("fr-FR");
    expect(passages("The Arabic text is here", "ar")[0]!.langue).toBe("en-US");
    expect(passages("[la fiche](/fr/glossaire#hasan) **ḥasan**", "fr")[0]!.texte).toBe("la fiche ḥasan");
  });
});
