import { afterEach, describe, expect, it } from "vitest";
import { motsTrouves, normaliserTexte } from "@/lib/forum/filtre";
import { codeInvitation, creerSessionMembre, hacherMotDePasse, lireSession, verifierMotDePasse } from "@/lib/forum/securite";
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
    const s = creerSessionMembre(7, 2);
    expect(lireSession(s)).toEqual({ id: 7, version: 2 });
    expect(lireSession(s.replace(/^7\./, "8."))).toBeNull();
    expect(lireSession(s.replace(/^7\.2\./, "7.3."))).toBeNull();
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
    const { sujet, message } = (await d.creerSujet(moi.id, "Une question", "texte avec un mot interdit", "retenu", ["interdit"], { n: 6, fenetreMs: 600_000 }))!;
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

describe("forum : corrections de la relecture", () => {
  const quota = { n: 6, fenetreMs: 600_000 };
  const membre = async (d: ReturnType<typeof depotForumMemoire>, nom: string) => {
    await d.creerInvitation(`AAAA-BBBB-${nom.slice(0, 4).toUpperCase().padEnd(4, "C")}`, "");
    const r = await d.inscrire({ code: `AAAA-BBBB-${nom.slice(0, 4).toUpperCase().padEnd(4, "C")}`, email: `${nom}@exemple.test`, nom, hash: "x" });
    return r.ok ? r.membre : null!;
  };

  it("change la version du membre avec son mot de passe (les anciennes sessions tombent)", async () => {
    const d = depotForumMemoire();
    const m = await membre(d, "Zayd");
    expect(m.version).toBe(0);
    await d.changerMotDePasse(m.id, hacherMotDePasse("nouveau-mot-de-passe"));
    expect((await d.membreParId(m.id))?.version).toBe(1);
  });

  it("ne dépasse pas le quota, même avec 20 envois simultanés", async () => {
    const d = depotForumMemoire();
    const m = await membre(d, "Hind");
    const r = await Promise.all(Array.from({ length: 20 }, (_, i) => d.creerSujet(m.id, `Sujet ${i}`, "texte", "publie", [], quota)));
    expect(r.filter(Boolean).length).toBe(6);
  });

  it("remet en tête une discussion dont la réponse retenue est acceptée", async () => {
    const d = depotForumMemoire();
    const m = await membre(d, "Umar");
    const { sujet } = (await d.creerSujet(m.id, "Ancienne discussion", "texte", "publie", [], quota))!;
    const avant = (await d.sujet(sujet.id, true))!.dernierLe;
    const rep = (await d.ajouterMessage(sujet.id, m.id, "réponse", "retenu", ["x"], quota))!;
    await new Promise((f) => setTimeout(f, 5));
    await d.modererMessage(rep.id, "publie");
    expect((await d.sujet(sujet.id, true))!.dernierLe > avant).toBe(true);
  });
});

describe("mot de passe oublié (jetons)", () => {
  it("un jeton change le mot de passe une seule fois, révoque les sessions et annule les autres jetons", async () => {
    const { empreinteJeton, jetonReinitialisation } = await import("@/lib/forum/securite");
    const d = depotForumMemoire();
    await d.creerInvitation("AAAA-BBBB-CCCC", "");
    const r = await d.inscrire({ code: "AAAA-BBBB-CCCC", email: "a@exemple.test", nom: "Abc", hash: hacherMotDePasse("ancien-mdp-123") });
    if (!r.ok) throw new Error("inscription");
    const j1 = jetonReinitialisation(), j2 = jetonReinitialisation();
    expect(j1).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await d.creerJeton(r.membre.id, empreinteJeton(j1), 60_000);
    await d.creerJeton(r.membre.id, empreinteJeton(j2), 60_000);
    expect(await d.utiliserJeton(empreinteJeton(j1), hacherMotDePasse("nouveau-mdp-123"))).toBe(r.membre.id);
    const m = (await d.membreParEmail("a@exemple.test"))!;
    expect(verifierMotDePasse("nouveau-mdp-123", m.hash)).toBe(true);
    expect(m.version).toBe(1);
    expect(await d.utiliserJeton(empreinteJeton(j1), hacherMotDePasse("x-x-x-x-x-x"))).toBeNull();
    expect(await d.utiliserJeton(empreinteJeton(j2), hacherMotDePasse("x-x-x-x-x-x"))).toBeNull();
  });

  it("refuse un jeton expiré ou celui d'un membre bloqué", async () => {
    const { empreinteJeton } = await import("@/lib/forum/securite");
    const d = depotForumMemoire();
    await d.creerInvitation("AAAA-BBBB-DDDD", "");
    const r = await d.inscrire({ code: "AAAA-BBBB-DDDD", email: "b@exemple.test", nom: "Bcd", hash: hacherMotDePasse("ancien-mdp-123") });
    if (!r.ok) throw new Error("inscription");
    await d.creerJeton(r.membre.id, empreinteJeton("expire"), -1);
    expect(await d.utiliserJeton(empreinteJeton("expire"), "h")).toBeNull();
    await d.creerJeton(r.membre.id, empreinteJeton("bloque"), 60_000);
    await d.changerStatut(r.membre.id, "bloque");
    expect(await d.utiliserJeton(empreinteJeton("bloque"), "h")).toBeNull();
  });
});
