// Réponse dans une discussion visible et ouverte (POST { corps }) ; le filtre de mots retient le message si besoin.
import { NextResponse } from "next/server";
import { z } from "zod";
import { memeOrigine } from "@/lib/admin-auth";
import { depotForum } from "@/lib/forum/depot";
import { motsTrouves } from "@/lib/forum/filtre";
import { LIMITE_MESSAGES, formats, membreConnecte } from "@/lib/forum/acces";

export const runtime = "nodejs";
const saisie = z.object({ corps: formats.corps });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!memeOrigine(req)) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  const d = depotForum();
  if (!d) return NextResponse.json({ erreur: "indisponible" }, { status: 503 });
  const moi = await membreConnecte(req);
  if (!moi) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  const { id } = await ctx.params;
  const n = /^\d{1,9}$/.test(id) ? Number(id) : NaN;
  const sujet = Number.isSafeInteger(n) ? await d.sujet(n, false) : null;
  if (!sujet) return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  if (sujet.ferme) return NextResponse.json({ erreur: "ferme" }, { status: 409 });
  const v = saisie.safeParse(await req.json().catch(() => null));
  if (!v.success) return NextResponse.json({ erreur: "invalide" }, { status: 400 });
  if ((await d.messagesRecentsDe(moi.id, LIMITE_MESSAGES.fenetreMs)) >= LIMITE_MESSAGES.n) return NextResponse.json({ erreur: "trop" }, { status: 429 });
  const trouves = motsTrouves(v.data.corps, await d.listerMots());
  const m = await d.ajouterMessage(sujet.id, moi.id, v.data.corps, trouves.length ? "retenu" : "publie", trouves);
  return NextResponse.json({ id: m.id, statut: m.statut }, { status: 201 });
}
