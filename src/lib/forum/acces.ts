/**
 * Règles communes du forum : membre connecté (et non bloqué), limites de fréquence, formats des saisies.
 */
import { z } from "zod";
import { cookieMembre, idDeSession } from "@/lib/forum/securite";
import { depotForum, type Membre } from "@/lib/forum/depot";

// Membre de la session, seulement s'il existe et n'est pas bloqué (relu à chaque requête).
export async function membreConnecte(req: Request): Promise<Membre | null> {
  const id = idDeSession(cookieMembre(req));
  const d = depotForum();
  if (id === null || !d) return null;
  const m = await d.membreParId(id).catch(() => null);
  return m && m.statut === "actif" ? m : null;
}

// Limite simple par clé (adresse IP ou membre) : n actions par fenêtre (mémoire de l'instance).
const compteurs = new Map<string, number[]>();
export function tropDeRequetes(cle: string, n: number, fenetreMs: number): boolean {
  const t = Date.now();
  const r = (compteurs.get(cle) ?? []).filter((x) => t - x < fenetreMs);
  r.push(t);
  compteurs.set(cle, r);
  if (compteurs.size > 5000) for (const [k, v] of compteurs) if (v.every((x) => t - x >= fenetreMs)) compteurs.delete(k);
  return r.length > n;
}
export const ipDe = (req: Request) => (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local").trim().slice(0, 70);

export const formats = {
  email: z.string().trim().toLowerCase().email().max(200),
  nom: z.string().trim().min(3).max(30).regex(/^[\p{L}\p{N} _.-]+$/u),
  motDePasse: z.string().min(10).max(200),
  code: z.string().trim().toUpperCase().regex(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/),
  titre: z.string().trim().min(5).max(150),
  corps: z.string().trim().min(2).max(5000),
  mot: z.string().trim().min(2).max(80),
};
// Au plus 6 messages (discussions comprises) par membre en 10 minutes.
export const LIMITE_MESSAGES = { n: 6, fenetreMs: 10 * 60 * 1000 };
