// Envoi d'un PDF (formulaire, champ « fichier ») vers Vercel Blob ; renvoie son adresse publique.
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { adminConnecte, memeOrigine } from "@/lib/admin-auth";
import { slugDe } from "@/lib/contenus/depot";

export const runtime = "nodejs";
const TAILLE_MAX = 4 * 1024 * 1024; // limite d'une requête sur Vercel : 4,5 Mo

export async function POST(req: Request) {
  if (!memeOrigine(req)) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  if (!adminConnecte(req)) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ erreur: "stockage" }, { status: 503 });
  const formulaire = await req.formData().catch(() => null);
  const fichier = formulaire?.get("fichier");
  if (!(fichier instanceof File)) return NextResponse.json({ erreur: "invalide" }, { status: 400 });
  if (fichier.size > TAILLE_MAX) return NextResponse.json({ erreur: "trop-gros" }, { status: 413 });
  const debut = new Uint8Array(await fichier.slice(0, 5).arrayBuffer());
  const estPdf = fichier.type === "application/pdf" && String.fromCharCode(...debut) === "%PDF-";
  if (!estPdf) return NextResponse.json({ erreur: "pas-pdf" }, { status: 415 });
  const nom = fichier.name.replace(/\.pdf$/i, "").slice(0, 120);
  const blob = await put(`contenus/${slugDe(nom)}.pdf`, fichier, { access: "public", contentType: "application/pdf", addRandomSuffix: true });
  return NextResponse.json({ url: blob.url, nom: `${nom}.pdf` }, { status: 201 });
}
