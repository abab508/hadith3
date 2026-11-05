/**
 * Outils de l'assistant : ils appellent les fonctions existantes du site (aucune recherche dupliquée)
 * et renvoient toujours la source et le chemin de la page Milaghaiba correspondante.
 * Rien n'est trouvé ? L'outil le dit explicitement (« aucun résultat »).
 */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { chercher, normaliser } from "@/donnees/recherche";
import { corpus, ouvrageParId } from "@/donnees/corpus";
import { EXTERNAL_COLLECTIONS, remoteLanguage, remoteSearch } from "@/donnees/recherche-distante";
import { chaineKg } from "@/donnees/fiches-kg";
import { ficheBio, filtrer, personnesDe, SERIES_PERSONNES } from "@/donnees/biographies";
import { termes } from "@/donnees/termes";
import { definitionGlossaire } from "@/donnees/definitions-glossaire";

const AUCUN = "aucun résultat";
const LONGUEUR_TEXTE = 1500;
const couper = (t: string, n = LONGUEUR_TEXTE) => (t.length <= n ? t : `${t.slice(0, n)} …`);
const IDS_RECUEILS = EXTERNAL_COLLECTIONS.map((c) => c.id);

export const DEFINITIONS_OUTILS: Anthropic.Beta.BetaTool[] = [
  {
    name: "rechercher_hadith",
    description: "Cherche un hadith dans les sources de Milaghaiba : les 7 grands recueils (éditions publiques hadith-api, arabe et français) et le corpus analysé du site. Accepte des mots (arabe ou français) ou un numéro. Renvoie le texte exact de la source, la référence, l'origine de la traduction et le chemin de la page du site. À appeler avant toute réponse sur un hadith.",
    input_schema: {
      type: "object",
      properties: {
        requete: { type: "string", description: "Mots du hadith (de préférence en arabe) ou numéro du hadith." },
        recueil: { type: "string", enum: IDS_RECUEILS, description: "Facultatif : limiter à un recueil (ex. sahih-bukhari)." },
      },
      required: ["requete"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "lire_rapport",
    description: "Donne la chaîne de transmission (isnād) d'un hadith d'un des 7 grands recueils, du Compagnon jusqu'à l'auteur du recueil, avec les fiches des transmetteurs et les jugements des critiques attribués nommément (base hadith-kg). Renvoie « aucun résultat » si la chaîne n'est pas encore analysée.",
    input_schema: {
      type: "object",
      properties: {
        recueil: { type: "string", enum: IDS_RECUEILS },
        numero: { type: "integer", minimum: 1 },
      },
      required: ["recueil", "numero"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "fiche_transmetteur",
    description: "Cherche la fiche d'une personne de la transmission (Compagnon, Successeur, savant) par son nom en arabe, ou par son numéro de fiche. Renvoie les données de la fiche (dates, lieux, génération, jugements attribués) et le chemin de sa page.",
    input_schema: {
      type: "object",
      properties: {
        nom: { type: "string", description: "Nom en arabe (ex. أبو هريرة)." },
        id: { type: "integer", description: "Numéro de fiche, si on le connaît déjà." },
      },
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
  {
    name: "definir_terme",
    description: "Donne la définition d'un terme de la science du hadith depuis le glossaire du site (ex. ṣaḥīḥ, ḥasan, isnād, صحيح).",
    input_schema: {
      type: "object",
      properties: { terme: { type: "string" } },
      required: ["terme"],
      additionalProperties: false,
    },
    eager_input_streaming: true,
  },
];

const schemas = {
  rechercher_hadith: z.object({ requete: z.string().trim().min(1).max(200), recueil: z.enum(IDS_RECUEILS as [string, ...string[]]).optional() }),
  lire_rapport: z.object({ recueil: z.enum(IDS_RECUEILS as [string, ...string[]]), numero: z.number().int().min(1).max(100000) }),
  fiche_transmetteur: z.object({ nom: z.string().trim().max(120).optional(), id: z.number().int().min(0).max(999999).optional() })
    .refine((v) => v.nom || v.id !== undefined),
  definir_terme: z.object({ terme: z.string().trim().min(1).max(80) }),
};
export type NomOutil = keyof typeof schemas;
export const estOutil = (n: string): n is NomOutil => Object.hasOwn(schemas, n);

async function rechercherHadith({ requete, recueil }: z.infer<typeof schemas.rechercher_hadith>, locale: string) {
  const resultats: Record<string, unknown>[] = [];
  // 1. Corpus analysé du site (données d'exemple, à valider).
  // (Sans mot utile, chercher() renvoie tout le corpus : ce n'est pas un résultat.)
  const locaux = recueil ? [] : chercher(requete);
  if (locaux.length < corpus.hadiths.length) {
    for (const h of locaux.slice(0, 3)) {
      resultats.push({
        source: "Corpus analysé de Milaghaiba (statut : exemple à valider par un spécialiste)",
        texteArabe: h.texteAr,
        references: h.occurrences.map((o) => `${ouvrageParId(o.ouvrage)?.nom ?? o.ouvrage}, n° ${o.numero}`),
        traductions: h.traductions.map((t) => ({ langue: t.langue, texte: t.texte, origine: { publiee: "publiée", validee: "validée par un humain", ia: "générée par IA, non vérifiée", "ia-relue": "générée par IA puis relue" }[t.origine], source: t.source })),
        page: `/${locale}/rapport/${h.id}`,
      });
    }
  }
  // 2. Les 7 grands recueils (index local + éditions publiques).
  const langue = remoteLanguage(locale, requete) === "ara" ? "ara" : "fra";
  for (const l of langue === "ara" ? ["ara"] : ["fra", "ara"]) {
    const r = await remoteSearch(requete, recueil, l, 1, 5);
    for (const h of r.items) {
      resultats.push({
        source: `${h.nom} — édition publique hadith-api (fawazahmed0), ${l === "ara" ? "texte arabe" : "traduction française publiée par cette édition"}`,
        reference: `${h.nom}, n° ${h.numero}${h.section ? `, livre ${h.section}` : ""}`,
        [l === "ara" ? "texteArabe" : "traductionPubliee"]: couper(h.texte),
        jugementsDeLaSource: h.grades.map((g) => `${g.name} : ${g.grade}`),
        page: `/${locale}/hadith/${h.recueil}/ara/${h.numero}`,
        rapport: `/${locale}/hadith/${h.recueil}/ara/${h.numero}/rapport`,
      });
    }
    if (resultats.length > 0) break;
  }
  return resultats.length > 0 ? { resultats } : { resultat: AUCUN };
}

async function lireRapport({ recueil, numero }: z.infer<typeof schemas.lire_rapport>, locale: string) {
  const c = EXTERNAL_COLLECTIONS.find((x) => x.id === recueil)!;
  const maillons = await chaineKg(c.key, numero);
  if (!maillons) return { resultat: AUCUN, note: "La chaîne de ce récit n'est pas encore analysée sur Milaghaiba.", page: `/${locale}/hadith/${recueil}/ara/${numero}` };
  return {
    source: "Base « الجامع — Hadith Knowledge Graph » (emadjumaah), CC BY 4.0 ; chaîne reliée au hadith par comparaison des textes arabes",
    ordre: "du Compagnon jusqu'à l'auteur du recueil",
    chaine: maillons.map((m) => ({
      nom: m.kunya ?? m.nom, nomComplet: m.nom, deces: m.deces ? `${m.deces} H` : undefined, rangSelonLaSource: m.rang,
      jugements: m.jugements.slice(0, 4).map((j) => `${j.critique} : ${j.texte}`), auteurDuRecueil: m.auteur || undefined,
    })),
    rapport: `/${locale}/hadith/${recueil}/ara/${numero}/rapport`,
  };
}

async function ficheTransmetteur({ nom, id }: z.infer<typeof schemas.fiche_transmetteur>, locale: string) {
  let ids: number[] = id !== undefined ? [id] : [];
  if (nom) {
    const vus = new Set<number>();
    for (const s of [...SERIES_PERSONNES, "auteurs"] as const) for (const [pid] of filtrer(personnesDe(s), nom)) vus.add(pid);
    ids = [...vus].slice(0, 3);
  }
  const fiches = [];
  for (const pid of ids) {
    const f = await ficheBio(pid);
    if (!f) continue;
    fiches.push({
      nom: f.kunya ?? f.nom, nomComplet: f.nom, generationSelonLaSource: f.tabaqa, naissance: f.naissance && `${f.naissance} H`, deces: f.deces && `${f.deces} H`,
      residence: f.residence, lieuDeces: f.lieuDeces, rangSelonLaSource: f.rang, recits: f.riwayat,
      jugements: (f.jugements ?? []).slice(0, 5).map(([c, t]) => `${c} : ${t}`), page: `/${locale}/biographies/personne/${pid}`,
    });
  }
  return fiches.length > 0 ? { source: "Base « الجامع — Hadith Knowledge Graph » (emadjumaah), CC BY 4.0", fiches } : { resultat: AUCUN };
}

function definirTerme({ terme }: z.infer<typeof schemas.definir_terme>, locale: string) {
  const q = normaliser(terme);
  const t = termes.termes.find((x) =>
    [x.ar, x.translitteration, ...x.variantesTranslitteration, ...Object.values(x.langues).map((l) => l.terme)].some((v) => normaliser(v) === q),
  );
  if (!t) return { resultat: AUCUN };
  const def = definitionGlossaire(t.id, locale);
  const trad = t.langues[locale] ?? t.langues.fr!;
  return { terme: trad.terme, arabe: t.ar, translitteration: t.translitteration, definition: def?.texte ?? trad.explication, page: `/${locale}/glossaire#${t.id}`, source: "Glossaire de Milaghaiba" };
}

// Exécute un outil après validation de son entrée (le modèle peut produire une entrée incomplète).
export async function executerOutil(nom: string, entree: unknown, locale: string): Promise<{ contenu: string; erreur: boolean }> {
  if (!estOutil(nom)) return { contenu: `Outil inconnu : ${nom}`, erreur: true };
  const v = schemas[nom].safeParse(entree);
  if (!v.success) return { contenu: JSON.stringify({ INVALID_JSON: JSON.stringify(entree) }), erreur: true };
  try {
    const r =
      nom === "rechercher_hadith" ? await rechercherHadith(v.data as z.infer<typeof schemas.rechercher_hadith>, locale)
      : nom === "lire_rapport" ? await lireRapport(v.data as z.infer<typeof schemas.lire_rapport>, locale)
      : nom === "fiche_transmetteur" ? await ficheTransmetteur(v.data as z.infer<typeof schemas.fiche_transmetteur>, locale)
      : definirTerme(v.data as z.infer<typeof schemas.definir_terme>, locale);
    return { contenu: JSON.stringify(r), erreur: false };
  } catch {
    return { contenu: "Source momentanément indisponible.", erreur: true };
  }
}
