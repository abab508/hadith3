// Modification (PUT) et suppression (DELETE) d'un contenu ; le PDF supprimé l'est aussi du stockage.
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { adminConnecte, memeOrigine } from "@/lib/admin-auth";
import { depot, saisieContenu } from "@/lib/contenus/depot";
import { stockagePdf, urlPdfValide } from "@/lib/contenus/pdf";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

async function garde(req: Request, ctx: Ctx) {
  if (!memeOrigine(req)) return { reponse: NextResponse.json({ erreur: "origine" }, { status: 403 }) };
  if (!adminConnecte(req)) return { reponse: NextResponse.json({ erreur: "connexion" }, { status: 401 }) };
  const d = depot();
  if (!d) return { reponse: NextResponse.json({ erreur: "base" }, { status: 503 }) };
  const { id } = await ctx.params;
  const n = /^\d{1,9}$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(n)) return { reponse: NextResponse.json({ erreur: "introuvable" }, { status: 404 }) };
  return { d, n };
}

const retirerPdf = async (url: string | null) => {
  if (url && stockagePdf() && urlPdfValide(url)) await del(url).catch(() => undefined);
};

export async function PUT(req: Request, ctx: Ctx) {
  const g = await garde(req, ctx);
  if ("reponse" in g) return g.reponse;
  const v = saisieContenu.safeParse(await req.json().catch(() => null));
  if (!v.success) return NextResponse.json({ erreur: "invalide", details: v.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const avant = await g.d.lireParId(g.n);
  const c = await g.d.modifier(g.n, v.data);
  if (!c) return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  if (avant?.pdfUrl && avant.pdfUrl !== c.pdfUrl) await retirerPdf(avant.pdfUrl);
  return NextResponse.json({ contenu: c });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await garde(req, ctx);
  if ("reponse" in g) return g.reponse;
  const c = await g.d.supprimer(g.n);
  if (!c) return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  await retirerPdf(c.pdfUrl);
  return NextResponse.json({ ok: true });
}
