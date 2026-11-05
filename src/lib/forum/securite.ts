/**
 * Mots de passe des membres (scrypt, sel aléatoire) et session de membre signée (cookie de 30 jours).
 * La session ne porte que l'identifiant : le statut (bloqué ou non) est relu à chaque requête.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hacherMotDePasse(mdp: string): string {
  const sel = randomBytes(16);
  return `scrypt$${sel.toString("hex")}$${scryptSync(mdp, sel, 64).toString("hex")}`;
}

export function verifierMotDePasse(mdp: string, stocke: string): boolean {
  const [algo, selHex, hachHex] = stocke.split("$");
  if (algo !== "scrypt" || !selHex || !hachHex) return false;
  const attendu = Buffer.from(hachHex, "hex");
  const calcule = scryptSync(mdp, Buffer.from(selHex, "hex"), attendu.length);
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}

// Code d'invitation lisible : 3 groupes de 4 caractères sans lettres ambiguës (0/O, 1/I).
export function codeInvitation(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const c = Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join("");
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
}

// Mot de passe provisoire donné par l'admin à un membre (à changer ensuite).
export const motDePasseProvisoire = () => randomBytes(9).toString("base64url");

export const COOKIE_MEMBRE = "milaghaiba_membre";
const DUREE = 60 * 60 * 24 * 30;
const secret = () => process.env.HADITH_IMPORT_SESSION_SECRET ?? "";
export const sessionsMembresPossibles = () => secret().length >= 32;
const signer = (t: string) => createHmac("sha256", secret()).update(`membre:${t}`).digest("hex");

export function creerSessionMembre(id: number): string {
  const corps = `${id}.${Math.floor(Date.now() / 1000) + DUREE}.${randomBytes(9).toString("hex")}`;
  return `${corps}.${signer(corps)}`;
}

export function idDeSession(valeur?: string): number | null {
  if (!sessionsMembresPossibles() || !valeur) return null;
  const morceaux = valeur.split(".");
  if (morceaux.length !== 4) return null;
  const [id, exp, alea, sig] = morceaux as [string, string, string, string];
  const attendu = Buffer.from(signer(`${id}.${exp}.${alea}`)), recu = Buffer.from(sig);
  if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) return null;
  const fin = Number(exp), n = Number(id);
  if (!Number.isSafeInteger(fin) || fin < Math.floor(Date.now() / 1000) || !Number.isSafeInteger(n)) return null;
  return n;
}

export const optionsCookieMembre = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: DUREE,
});
export const cookieMembre = (req: Request) =>
  req.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith(`${COOKIE_MEMBRE}=`))?.slice(COOKIE_MEMBRE.length + 1);
