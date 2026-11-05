// Lecture d'un PDF de contenu : seulement s'il est rattaché à un contenu publié (ou pour l'admin connecté).
import { get } from "@vercel/blob";
import { adminConnecte } from "@/lib/admin-auth";
import { depot } from "@/lib/contenus/depot";
import { accesPdf, stockagePdf, urlPdfValide } from "@/lib/contenus/pdf";

export const runtime = "nodejs";
const introuvable = () => new Response("Introuvable", { status: 404, headers: { "cache-control": "no-store" } });

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("u") ?? "";
  const d = depot();
  if (!stockagePdf() || !d || !urlPdfValide(url)) return introuvable();
  const admin = adminConnecte(req);
  const contenus = await d.lister(admin ? {} : { publiesSeulement: true }).catch(() => []);
  const contenu = contenus.find((c) => c.pdfUrl === url);
  // Un visiteur ne lit que le PDF d'un contenu publié ; l'admin peut aussi revoir un PDF pas encore enregistré.
  if (!contenu && !admin) return introuvable();
  const r = await get(url, { access: accesPdf(url) }).catch(() => null);
  if (!r || r.statusCode !== 200) return introuvable();
  const nom = (contenu?.pdfNom ?? "document.pdf").replace(/[^\p{L}\p{N}._ -]/gu, "_");
  return new Response(r.stream, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(nom)}`,
      "cache-control": admin ? "private, no-store" : "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
