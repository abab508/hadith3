// Compte des membres du forum : état (GET), inscription avec code d'invitation, connexion, déconnexion,
// changement de mot de passe (POST { action, ... }).
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { courrielPossible, envoyerCourriel } from "@/lib/courriel";
import { memeOrigine } from "@/lib/admin-auth";
import { depotForum } from "@/lib/forum/depot";
import { formats, ipDe, membreConnecte, tropDeRequetes } from "@/lib/forum/acces";
import { COOKIE_MEMBRE, DUREE_JETON_MS, creerSessionMembre, empreinteJeton, jetonReinitialisation, hacherMotDePasse, optionsCookieMembre, sessionsMembresPossibles, verifierMotDePasse } from "@/lib/forum/securite";

export const runtime = "nodejs";
const sansCache = { "Cache-Control": "no-store" };
const erreur = (code: string, status: number) => NextResponse.json({ erreur: code }, { status, headers: sansCache });

const actions = z.discriminatedUnion("action", [
  z.object({ action: z.literal("inscription"), code: formats.code, email: formats.email, nom: formats.nom, motDePasse: formats.motDePasse }),
  z.object({ action: z.literal("connexion"), email: formats.email, motDePasse: z.string().max(200) }),
  z.object({ action: z.literal("deconnexion") }),
  z.object({ action: z.literal("motDePasse"), ancien: z.string().max(200), nouveau: formats.motDePasse }),
  z.object({ action: z.literal("oubli"), email: formats.email, locale: z.string().max(5) }),
  z.object({ action: z.literal("reinitialiser"), jeton: z.string().regex(/^[A-Za-z0-9_-]{43}$/), nouveau: formats.motDePasse }),
]);

// Adresse du site pour le lien envoyé par e-mail : l'adresse de production fixée par Vercel,
// jamais l'en-tête Host de la requête (qui pourrait être falsifié).
const adresseSite = (req: Request) =>
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : new URL(req.url).origin;

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

  if (a.action === "oubli") {
    // Sans service d'e-mail : la page propose de contacter l'administrateur.
    if (!courrielPossible()) return erreur("courriel", 503);
    if (tropDeRequetes(`oubli:${a.email}`, 3, 60 * 60 * 1000)) return erreur("trop", 429);
    const m = await d.membreParEmail(a.email);
    // Même réponse que l'adresse existe ou non (on ne révèle pas qui est inscrit).
    if (m && m.statut === "actif") {
      const jeton = jetonReinitialisation();
      await d.creerJeton(m.id, empreinteJeton(jeton), DUREE_JETON_MS);
      const locale = hasLocale(routing.locales, a.locale) ? a.locale : routing.defaultLocale;
      const t = await getTranslations({ locale, namespace: "compte.courriel" });
      const lien = `${adresseSite(req)}/${locale}/compte/nouveau-mot-de-passe#${jeton}`;
      await envoyerCourriel({ a: m.email, sujet: t("sujet"), texte: t("texte", { nom: m.nom, lien }) });
    }
    return NextResponse.json({ ok: true }, { headers: sansCache });
  }

  if (a.action === "reinitialiser") {
    const id = await d.utiliserJeton(empreinteJeton(a.jeton), hacherMotDePasse(a.nouveau));
    if (id === null) return erreur("jeton", 400);
    return NextResponse.json({ ok: true }, { headers: sansCache });
  }

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
