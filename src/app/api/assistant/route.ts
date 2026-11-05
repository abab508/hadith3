/**
 * Assistant IA documentaire : POST { messages, locale } -> flux NDJSON
 * ({ t: "texte", d } | { t: "outil", nom } | { t: "fin" } | { t: "erreur", code }).
 * Claude (modèle ASSISTANT_MODEL, Sonnet 5.5 par défaut) + charte en prompt système + outils du site,
 * boucle d'appels d'outils jusqu'à la réponse finale. La clé ANTHROPIC_API_KEY vit dans Vercel, jamais dans le code.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CHARTE } from "@/lib/assistant/charte";
import { DEFINITIONS_OUTILS, executerOutil } from "@/lib/assistant/outils";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODELE = process.env.ASSISTANT_MODEL || "claude-sonnet-5-5";
const LONGUEUR_MAX = 1500;     // caractères par message
const HISTORIQUE_MAX = 10;     // derniers messages gardés
const TOURS_OUTILS_MAX = 6;    // appels successifs à Claude par question
const LIMITE = { requetes: 20, fenetreMs: 10 * 60 * 1000 }; // par visiteur

const corps = z.object({
  locale: z.enum(routing.locales as unknown as [string, ...string[]]),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(LONGUEUR_MAX) }))
    .min(1).max(50),
});

// Limitation simple par adresse (mémoire de l'instance : protection de base, pas une garantie absolue).
const visites = new Map<string, number[]>();
function trop(ip: string): boolean {
  const maintenant = Date.now();
  const recentes = (visites.get(ip) ?? []).filter((t) => maintenant - t < LIMITE.fenetreMs);
  recentes.push(maintenant);
  visites.set(ip, recentes);
  if (visites.size > 5000) for (const [k, v] of visites) if (v.every((t) => maintenant - t >= LIMITE.fenetreMs)) visites.delete(k);
  return recentes.length > LIMITE.requetes;
}

const reponseErreur = (code: string, status: number) =>
  new Response(JSON.stringify({ t: "erreur", code }) + "\n", { status, headers: { "content-type": "application/x-ndjson; charset=utf-8" } });

export async function POST(requete: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return reponseErreur("indisponible", 503);
  const ip = requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (trop(ip)) return reponseErreur("trop", 429);

  let donnees: z.infer<typeof corps>;
  try {
    const v = corps.safeParse(await requete.json());
    if (!v.success) return reponseErreur("invalide", 400);
    donnees = v.data;
  } catch {
    return reponseErreur("invalide", 400);
  }
  const { locale } = donnees;
  // Historique limité, commençant par un message de l'utilisateur.
  let historique = donnees.messages.slice(-HISTORIQUE_MAX);
  while (historique.length > 0 && historique[0]!.role !== "user") historique = historique.slice(1);
  if (historique.length === 0 || historique.at(-1)!.role !== "user") return reponseErreur("invalide", 400);

  const client = new Anthropic();
  const encodeur = new TextEncoder();
  const flux = new ReadableStream<Uint8Array>({
    async start(controleur) {
      const envoyer = (o: object) => controleur.enqueue(encodeur.encode(JSON.stringify(o) + "\n"));
      const messages: Anthropic.Beta.BetaMessageParam[] = historique.map((m) => ({ role: m.role, content: m.content }));
      try {
        for (let tour = 0; tour < TOURS_OUTILS_MAX; tour++) {
          const stream = client.beta.messages.stream({
            model: MODELE,
            max_tokens: 16000,
            // Refus d'un garde-fou : la requête est rejouée côté serveur sur un modèle de repli adapté.
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "medium" },
            cache_control: { type: "ephemeral" },
            system: [
              { type: "text", text: CHARTE },
              { type: "text", text: `Langue de l'interface de l'utilisateur : ${locale}. Préfixe des liens du site : /${locale}/.` },
            ],
            tools: DEFINITIONS_OUTILS,
            messages,
          });
          stream.on("text", (d) => envoyer({ t: "texte", d }));
          let message: Anthropic.Beta.BetaMessage;
          try {
            message = await stream.finalMessage();
          } catch (e) {
            // Entrée d'outil illisible (flux des entrées) : on rejoue le tour ; les erreurs de l'API remontent.
            if (e instanceof Anthropic.APIError) throw e;
            continue;
          }
          if (message.stop_reason === "refusal") { envoyer({ t: "erreur", code: "refus" }); break; }
          if (message.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: message.content }); continue; }
          const outils = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          if (message.stop_reason !== "tool_use" || outils.length === 0) break;
          messages.push({ role: "assistant", content: message.content });
          const resultats: Anthropic.Beta.BetaToolResultBlockParam[] = [];
          for (const o of outils) {
            envoyer({ t: "outil", nom: o.name });
            const r = await executerOutil(o.name, o.input, locale);
            resultats.push({ type: "tool_result", tool_use_id: o.id, content: r.contenu, is_error: r.erreur || undefined });
          }
          messages.push({ role: "user", content: resultats });
          envoyer({ t: "texte", d: "\n\n" });
        }
        envoyer({ t: "fin" });
      } catch (e) {
        const code = e instanceof Anthropic.RateLimitError ? "occupe" : "indisponible";
        if (e instanceof Anthropic.APIError) console.error(`Assistant : erreur API ${e.status}`);
        else console.error("Assistant : erreur", e instanceof Error ? e.message : "inconnue");
        envoyer({ t: "erreur", code });
      } finally {
        controleur.close();
      }
    },
  });
  return new Response(flux, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
