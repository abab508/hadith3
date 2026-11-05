// Session de l'espace contenus : état (GET), connexion (POST { motDePasse }), déconnexion (DELETE).
import { NextResponse } from "next/server";
import { COOKIE_ADMIN, adminConfigure, adminConnecte, creerSession, memeOrigine, motDePasseValide, optionsCookie } from "@/lib/admin-auth";
import { depot } from "@/lib/contenus/depot";
import { stockagePdf } from "@/lib/contenus/pdf";

export const runtime = "nodejs";
const essais = new Map<string, { n: number; depuis: number }>();
const sansCache = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  return NextResponse.json({
    configure: adminConfigure(), connecte: adminConnecte(req),
    base: depot() !== null, pdf: stockagePdf(),
  }, { headers: sansCache });
}

export async function POST(req: Request) {
  if (!memeOrigine(req)) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  if (!adminConfigure()) return NextResponse.json({ erreur: "non-configure" }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local").trim().slice(0, 70);
  const maintenant = Date.now(), e = essais.get(ip);
  const etat = e && maintenant - e.depuis < 15 * 60_000 ? e : { n: 0, depuis: maintenant };
  if (etat.n >= 8) return NextResponse.json({ erreur: "trop" }, { status: 429, headers: { "Retry-After": "900" } });
  let mdp = "";
  try {
    const corps = await req.json() as { motDePasse?: unknown };
    if (typeof corps.motDePasse === "string" && corps.motDePasse.length <= 256) mdp = corps.motDePasse;
  } catch { return NextResponse.json({ erreur: "invalide" }, { status: 400 }); }
  if (!motDePasseValide(mdp)) {
    etat.n++; essais.set(ip, etat);
    return NextResponse.json({ erreur: "mot-de-passe" }, { status: 401, headers: sansCache });
  }
  essais.delete(ip);
  const r = NextResponse.json({ ok: true }, { headers: sansCache });
  r.cookies.set(COOKIE_ADMIN, creerSession(), optionsCookie());
  return r;
}

export async function DELETE(req: Request) {
  if (!memeOrigine(req)) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  const r = NextResponse.json({ ok: true }, { headers: sansCache });
  r.cookies.set(COOKIE_ADMIN, "", { ...optionsCookie(), maxAge: 0 });
  return r;
}
