// Nouvelle discussion (POST { titre, corps }) par un membre connecté ; le filtre de mots s'applique au titre et au texte.
import { NextResponse } from "next/server";
import { z } from "zod";
import { memeOrigine } from "@/lib/admin-auth";
import { depotForum } from "@/lib/forum/depot";
import { motsTrouves } from "@/lib/forum/filtre";
import { LIMITE_MESSAGES, formats, membreConnecte } from "@/lib/forum/acces";

export const runtime = "nodejs";
const saisie = z.object({ titre: formats.titre, corps: formats.corps });

export async function POST(req: Request) {
  if (!memeOrigine(req)) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  const d = depotForum();
  if (!d) return NextResponse.json({ erreur: "indisponible" }, { status: 503 });
  const moi = await membreConnecte(req);
  if (!moi) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  const v = saisie.safeParse(await req.json().catch(() => null));
  if (!v.success) return NextResponse.json({ erreur: "invalide" }, { status: 400 });
  if ((await d.messagesRecentsDe(moi.id, LIMITE_MESSAGES.fenetreMs)) >= LIMITE_MESSAGES.n) return NextResponse.json({ erreur: "trop" }, { status: 429 });
  const trouves = motsTrouves(`${v.data.titre}\n${v.data.corps}`, await d.listerMots());
  const { sujet, message } = await d.creerSujet(moi.id, v.data.titre, v.data.corps, trouves.length ? "retenu" : "publie", trouves);
  return NextResponse.json({ id: sujet.id, statut: message.statut }, { status: 201 });
}
