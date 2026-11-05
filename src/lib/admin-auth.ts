/**
 * Connexion à l'espace d'administration des contenus (articles, actualités, informations, PDF).
 * Mêmes secrets Vercel que l'import : HADITH_ADMIN_PASSWORD (16 caractères ou plus)
 * et HADITH_IMPORT_SESSION_SECRET (32 caractères ou plus). Session signée de 2 h dans un cookie protégé.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const COOKIE_ADMIN = "milaghaiba_admin";
const DUREE = 60 * 60 * 2;
const secret = () => process.env.HADITH_IMPORT_SESSION_SECRET ?? "";

export const adminConfigure = () => (process.env.HADITH_ADMIN_PASSWORD?.length ?? 0) >= 16 && secret().length >= 32;

const egal = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
const signer = (texte: string) => createHmac("sha256", secret()).update(`contenus:${texte}`).digest("hex");

export const motDePasseValide = (mdp: string) => adminConfigure() && egal(mdp, process.env.HADITH_ADMIN_PASSWORD!);

export function creerSession(): string {
  const corps = `${Math.floor(Date.now() / 1000) + DUREE}.${randomBytes(18).toString("hex")}`;
  return `${corps}.${signer(corps)}`;
}

export function sessionValide(valeur?: string): boolean {
  if (!adminConfigure() || !valeur) return false;
  const [exp, alea, signature] = valeur.split(".");
  if (!exp || !alea || !signature) return false;
  const fin = Number(exp), maintenant = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(fin) || fin < maintenant || fin > maintenant + DUREE) return false;
  return egal(signature, signer(`${exp}.${alea}`));
}

export const optionsCookie = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: DUREE,
});

// Requête venue du site lui-même (protection contre les formulaires envoyés depuis un autre site).
export function memeOrigine(req: Request): boolean {
  const origine = req.headers.get("origin");
  if (!origine) return false;
  try {
    return new URL(origine).origin === new URL(req.url).origin && (req.headers.get("sec-fetch-site") ?? "same-origin") !== "cross-site";
  } catch { return false; }
}

const cookieDe = (req: Request) =>
  req.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith(`${COOKIE_ADMIN}=`))?.slice(COOKIE_ADMIN.length + 1);
export const adminConnecte = (req: Request) => sessionValide(cookieDe(req));
