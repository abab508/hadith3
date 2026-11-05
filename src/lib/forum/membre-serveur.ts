// Membre connecté vu depuis une page serveur (cookie de session), seulement s'il n'est pas bloqué.
import { cookies } from "next/headers";
import { COOKIE_MEMBRE, idDeSession } from "@/lib/forum/securite";
import { depotForum, type Membre } from "@/lib/forum/depot";

export async function membreDeLaPage(): Promise<Membre | null> {
  const id = idDeSession((await cookies()).get(COOKIE_MEMBRE)?.value);
  const d = depotForum();
  if (id === null || !d) return null;
  const m = await d.membreParId(id).catch(() => null);
  return m && m.statut === "actif" ? m : null;
}
