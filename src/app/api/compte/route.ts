// Compte des membres du forum : état (GET), inscription avec code d'invitation, connexion, déconnexion,
// changement de mot de passe (POST { action, ... }).
import { NextResponse } from "next/server";
import { z } from "zod";
import { memeOrigine } from "@/lib/admin-auth";
import { depotForum } from "@/lib/forum/depot";
import { formats, ipDe, membreConnecte, tropDeRequetes } from "@/lib/forum/acces";
import { COOKIE_MEMBRE, creerSessionMembre, hacherMotDePasse, optionsCookieMembre, sessionsMembresPossibles, verifierMotDePasse } from "@/lib/forum/securite";

export const runtime = "nodejs";
const sansCache = { "Cache-Control": "no-store" };
const erreur = (code: string, status: number) => NextResponse.json({ erreur: code }, { status, headers: sansCache });

const actions = z.discriminatedUnion("action", [
  z.object({ action: z.literal("inscription"), code: formats.code, email: formats.email, nom: formats.nom, motDePasse: formats.motDePasse }),
  z.object({ action: z.literal("connexion"), email: formats.email, motDePasse: z.string().max(200) }),
  z.object({ action: z.literal("deconnexion") }),
  z.object({ action: z.literal("motDePasse"), ancien: z.string().max(200), nouveau: formats.motDePasse }),
]);

export async function GET(req: Request) {
  const m = await membreConnecte(req);
  return NextResponse.json({ possible: depotForum() !== null && sessionsMembresPossibles(), membre: m ? { id: m.id, nom: m.nom } : null }, { headers: sansCache });
}

export async function POST(req: Request) {
  if (!memeOrigine(req)) return erreur("origine", 403);
  const d = depotForum();
  if (!d || !sessionsMembresPossibles()) return erreur("indisponible", 503);
  const v = actions.safeParse(await req.json().catch(() => null));
  if (!v.success) return erreur("invalide", 400);
  const a = v.data;

  if (a.action === "deconnexion") {
    const r = NextResponse.json({ ok: true }, { headers: sansCache });
    r.cookies.set(COOKIE_MEMBRE, "", { ...optionsCookieMembre(), maxAge: 0 });
    return r;
  }
  if (tropDeRequetes(`compte:${ipDe(req)}`, 10, 15 * 60 * 1000)) return erreur("trop", 429);

  if (a.action === "inscription") {
    const r = await d.inscrire({ code: a.code, email: a.email, nom: a.nom, hash: hacherMotDePasse(a.motDePasse) });
    if (!r.ok) return erreur(r.raison === "code" ? "code" : r.raison === "email" ? "email-pris" : "nom-pris", 409);
    const rep = NextResponse.json({ membre: { id: r.membre.id, nom: r.membre.nom } }, { status: 201, headers: sansCache });
    rep.cookies.set(COOKIE_MEMBRE, creerSessionMembre(r.membre.id, r.membre.version), optionsCookieMembre());
    return rep;
  }

  if (a.action === "connexion") {
    const m = await d.membreParEmail(a.email);
    // Même réponse si l'e-mail est inconnu ou le mot de passe faux (on ne révèle pas qui est inscrit).
    if (!m || !verifierMotDePasse(a.motDePasse, m.hash)) return erreur("identifiants", 401);
    if (m.statut === "bloque") return erreur("bloque", 403);
    const rep = NextResponse.json({ membre: { id: m.id, nom: m.nom } }, { headers: sansCache });
    rep.cookies.set(COOKIE_MEMBRE, creerSessionMembre(m.id, m.version), optionsCookieMembre());
    return rep;
  }

  // Changement de mot de passe : il faut être connecté et donner l'ancien.
  const moi = await membreConnecte(req);
  if (!moi) return erreur("connexion", 401);
  const interne = await d.membreParEmail(moi.email);
  if (!interne || !verifierMotDePasse(a.ancien, interne.hash)) return erreur("identifiants", 401);
  await d.changerMotDePasse(moi.id, hacherMotDePasse(a.nouveau));
  // Les autres sessions sont révoquées (version + 1) ; celle-ci reçoit une session neuve.
  const apres = await d.membreParId(moi.id);
  const rep = NextResponse.json({ ok: true }, { headers: sansCache });
  if (apres) rep.cookies.set(COOKIE_MEMBRE, creerSessionMembre(apres.id, apres.version), optionsCookieMembre());
  return rep;
}
