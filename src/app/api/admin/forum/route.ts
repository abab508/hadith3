// Modération du forum, réservée à l'administrateur connecté : vue d'ensemble (GET) et actions (POST { action, ... }).
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminConnecte, memeOrigine } from "@/lib/admin-auth";
import { depotForum } from "@/lib/forum/depot";
import { formats } from "@/lib/forum/acces";
import { codeInvitation, hacherMotDePasse, motDePasseProvisoire } from "@/lib/forum/securite";
import { normaliserTexte } from "@/lib/forum/filtre";

export const runtime = "nodejs";
const sansCache = { "Cache-Control": "no-store" };
const id = z.number().int().min(1);
const actions = z.discriminatedUnion("action", [
  z.object({ action: z.literal("inviter"), note: z.string().trim().max(120).default("") }),
  z.object({ action: z.literal("bloquer"), id }), z.object({ action: z.literal("debloquer"), id }),
  z.object({ action: z.literal("reinitialiser"), id }),
  z.object({ action: z.literal("ajouterMot"), mot: formats.mot }), z.object({ action: z.literal("retirerMot"), mot: z.string().max(80) }),
  z.object({ action: z.literal("publierMessage"), id }), z.object({ action: z.literal("masquerMessage"), id }),
  z.object({ action: z.literal("fermer"), id }), z.object({ action: z.literal("rouvrir"), id }),
  z.object({ action: z.literal("masquerSujet"), id }), z.object({ action: z.literal("afficherSujet"), id }),
]);

export async function GET(req: Request) {
  if (!adminConnecte(req)) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  const d = depotForum();
  if (!d) return NextResponse.json({ erreur: "base" }, { status: 503 });
  const [retenus, membres, invitations, mots, sujets] = await Promise.all([
    d.messagesRetenus(), d.listerMembres(), d.listerInvitations(), d.listerMots(), d.listerSujets(true),
  ]);
  return NextResponse.json({ retenus, membres, invitations, mots, sujets }, { headers: sansCache });
}

export async function POST(req: Request) {
  if (!memeOrigine(req)) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  if (!adminConnecte(req)) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  const d = depotForum();
  if (!d) return NextResponse.json({ erreur: "base" }, { status: 503 });
  const v = actions.safeParse(await req.json().catch(() => null));
  if (!v.success) return NextResponse.json({ erreur: "invalide" }, { status: 400 });
  const a = v.data;
  switch (a.action) {
    case "inviter": return NextResponse.json({ invitation: await d.creerInvitation(codeInvitation(), a.note) }, { status: 201, headers: sansCache });
    case "reinitialiser": {
      // Mot de passe provisoire affiché une seule fois à l'admin, qui le transmet au membre.
      const mdp = motDePasseProvisoire();
      const ok = await d.changerMotDePasse(a.id, hacherMotDePasse(mdp));
      return ok ? NextResponse.json({ motDePasse: mdp }, { headers: sansCache }) : NextResponse.json({ erreur: "introuvable" }, { status: 404 });
    }
    case "bloquer": case "debloquer": await d.changerStatut(a.id, a.action === "bloquer" ? "bloque" : "actif"); break;
    case "ajouterMot": await d.ajouterMot(normaliserTexte(a.mot)); break;
    case "retirerMot": await d.retirerMot(a.mot); break;
    case "publierMessage": case "masquerMessage": await d.modererMessage(a.id, a.action === "publierMessage" ? "publie" : "masque"); break;
    case "fermer": case "rouvrir": await d.modererSujet(a.id, { ferme: a.action === "fermer" }); break;
    case "masquerSujet": case "afficherSujet": await d.modererSujet(a.id, { masque: a.action === "masquerSujet" }); break;
  }
  return NextResponse.json({ ok: true }, { headers: sansCache });
}
