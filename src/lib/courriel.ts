/**
 * Envoi d'e-mails par SMTP (Gmail avec mot de passe d'application, Resend, Brevo… : tout service SMTP).
 * Variables : SMTP_HOST, SMTP_PORT (465 par défaut), SMTP_USER, SMTP_PASSWORD, MAIL_FROM.
 * Pour les tests seulement (dépôt en mémoire) : MILAGHAIBA_COURRIEL_JOURNAL=<fichier> écrit les e-mails
 * dans ce fichier au lieu de les envoyer.
 */
import { appendFile } from "node:fs/promises";
import nodemailer from "nodemailer";

export type Courriel = { a: string; sujet: string; texte: string };

const journal = () =>
  process.env.MILAGHAIBA_DEPOT_MEMOIRE === "1" && process.env.MILAGHAIBA_COURRIEL_JOURNAL ? process.env.MILAGHAIBA_COURRIEL_JOURNAL : null;

export const courrielPossible = () =>
  Boolean(journal() || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.MAIL_FROM));

export async function envoyerCourriel(c: Courriel): Promise<boolean> {
  const fichier = journal();
  if (fichier) { await appendFile(fichier, JSON.stringify(c) + "\n"); return true; }
  if (!courrielPossible()) return false;
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  try {
    await transport.sendMail({ from: process.env.MAIL_FROM, to: c.a, subject: c.sujet, text: c.texte });
    return true;
  } catch (e) {
    console.error("envoi d'e-mail impossible", e instanceof Error ? e.message : e);
    return false;
  }
}
