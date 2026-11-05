import { afterEach, describe, expect, it } from "vitest";
import { motsTrouves, normaliserTexte } from "@/lib/forum/filtre";
import { codeInvitation, creerSessionMembre, hacherMotDePasse, idDeSession, verifierMotDePasse } from "@/lib/forum/securite";
import { depotForumMemoire } from "@/lib/forum/depot";

describe("filtre des mots interdits", () => {
  it("ignore majuscules, accents, voyelles brèves arabes et lettres répétées", () => {
    expect(normaliserTexte("ÉCOLE")).toBe("ecole");
    expect(normaliserTexte("كَلِمَة")).toBe(normaliserTexte("كلمه"));
    expect(motsTrouves("Quel IDIOOOOOT !", ["idiot"])).toEqual(["idiot"]);
    expect(motsTrouves("Quel idiot !", ["IDIOT"])).toEqual(["IDIOT"]);
    expect(motsTrouves("هذا كَلْبٌ", ["كلب"])).toEqual(["كلب"]);
  });

  it("repère une expression entière, mais pas un mot caché dans un autre", () => {
    expect(motsTrouves("c'est une grosse bêtise", ["grosse betise"])).toEqual(["grosse betise"]);
    expect(motsTrouves("le mot classe", ["ass"])).toEqual([]);
  });
});

describe("mots de passe, sessions et invitations", () => {
  const avant = { ...process.env };
  afterEach(() => { process.env = { ...avant }; });

  it("vérifie un mot de passe haché, refuse un faux", () => {
    const h = hacherMotDePasse("un-bon-mot-de-passe");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(verifierMotDePasse("un-bon-mot-de-passe", h)).toBe(true);
    expect(verifierMotDePasse("faux", h)).toBe(false);
  });

  it("signe la session d'un membre et refuse une session modifiée", () => {
    process.env.HADITH_IMPORT_SESSION_SECRET = "secret-de-test-de-session-32-caracteres!";
    const s = creerSessionMembre(7);
    expect(idDeSession(s)).toBe(7);
    expect(idDeSession(s.replace(/^7\./, "8."))).toBeNull();
  });

  it("fabrique des codes d'invitation lisibles", () => {
    expect(codeInvitation()).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});

describe("forum : invitation, discussion, modération", () => {
  it("inscrit avec un code une seule fois, retient un message filtré, puis l'admin tranche", async () => {
    const d = depotForumMemoire();
    const inv = await d.creerInvitation("ABCD-EFGH-JKLM", "Ali");
    const r = await d.inscrire({ code: inv.code, email: "Ali@Exemple.test", nom: "Ali", hash: hacherMotDePasse("mot-de-passe-123") });
    expect(r.ok).toBe(true);
    expect(await d.inscrire({ code: inv.code, email: "autre@exemple.test", nom: "Autre", hash: "x" })).toEqual({ ok: false, raison: "code" });
    const moi = r.ok ? r.membre : null!;
    expect((await d.membreParEmail("ali@exemple.test"))?.id).toBe(moi.id);

    // Premier message retenu : la discussion reste cachée au public jusqu'à la décision.
    const { sujet, message } = await d.creerSujet(moi.id, "Une question", "texte avec un mot interdit", "retenu", ["interdit"]);
    expect(await d.listerSujets(false)).toEqual([]);
    expect((await d.messages(sujet.id, moi.id, false)).map((m) => m.id)).toEqual([message.id]); // l'auteur voit son message en attente
    expect(await d.messages(sujet.id, null, false)).toEqual([]);
    expect((await d.messagesRetenus()).map((m) => m.id)).toEqual([message.id]);
    await d.modererMessage(message.id, "publie");
    expect((await d.listerSujets(false)).map((s) => s.id)).toEqual([sujet.id]);

    // Fermeture et blocage.
    await d.modererSujet(sujet.id, { ferme: true });
    expect((await d.sujet(sujet.id, false))?.ferme).toBe(true);
    await d.changerStatut(moi.id, "bloque");
    expect((await d.membreParId(moi.id))?.statut).toBe("bloque");
  });
});
