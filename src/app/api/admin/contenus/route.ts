// Liste de tous les contenus (GET) et création (POST), réservées à l'administrateur connecté.
import { NextResponse } from "next/server";
import { adminConnecte, memeOrigine } from "@/lib/admin-auth";
import { depot, saisieContenu } from "@/lib/contenus/depot";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!adminConnecte(req)) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  const d = depot();
  if (!d) return NextResponse.json({ erreur: "base" }, { status: 503 });
  return NextResponse.json({ contenus: await d.lister() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!memeOrigine(req)) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  if (!adminConnecte(req)) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  const d = depot();
  if (!d) return NextResponse.json({ erreur: "base" }, { status: 503 });
  const v = saisieContenu.safeParse(await req.json().catch(() => null));
  if (!v.success) return NextResponse.json({ erreur: "invalide", details: v.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  return NextResponse.json({ contenu: await d.creer(v.data) }, { status: 201 });
}
