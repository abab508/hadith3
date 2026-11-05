// Membre connecté vu depuis une page serveur (cookie de session) : mêmes règles que pour les routes
// (non bloqué, session de la version actuelle du mot de passe).
import { cookies } from "next/headers";
import { COOKIE_MEMBRE } from "@/lib/forum/securite";
import { membreDeSession } from "@/lib/forum/acces";
import type { Membre } from "@/lib/forum/depot";

export async function membreDeLaPage(): Promise<Membre | null> {
  return membreDeSession((await cookies()).get(COOKIE_MEMBRE)?.value);
}
