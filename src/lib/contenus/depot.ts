/**
 * Contenus écrits par l'administrateur : articles, actualités, informations, avec un PDF facultatif.
 * Stockage : base Neon (DATABASE_URL ou POSTGRES_URL, ajoutée par l'intégration Vercel).
 * Sans base : dépôt en mémoire, seulement hors production ou si MILAGHAIBA_DEPOT_MEMOIRE=1 (tests).
 */
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { catalogue, entree } from "@/donnees/catalogue";

export const TYPES_CONTENU = ["article", "actualite", "information"] as const;
export type TypeContenu = typeof TYPES_CONTENU[number];
// Langues d'écriture possibles : celles du catalogue (data/langues/catalogue.json) qui ne sont pas désactivées.
export const languesContenu = (): string[] => catalogue.entrees.filter((e) => e.statut !== "desactivee").map((e) => e.tag);

export type Contenu = {
  id: number; slug: string; type: TypeContenu; titre: string; resume: string; corps: string; langue: string;
  pdfUrl: string | null; pdfNom: string | null; publie: boolean; creeLe: string; majLe: string; publieLe: string | null;
};

// Ce que l'administrateur envoie : contrôlé avant tout enregistrement.
export const saisieContenu = z.object({
  type: z.enum(TYPES_CONTENU),
  titre: z.string().trim().min(3).max(200),
  resume: z.string().trim().max(600).default(""),
  corps: z.string().trim().max(60000).default(""),
  langue: z.string().refine((t) => entree(t) !== undefined && entree(t)!.statut !== "desactivee", "langue inconnue du catalogue"),
  pdfUrl: z.string().url().startsWith("https://").max(500).nullable().default(null),
  pdfNom: z.string().trim().max(200).nullable().default(null),
  publie: z.boolean().default(false),
});
export type SaisieContenu = z.infer<typeof saisieContenu>;

// Adresse lisible tirée du titre (lettres latines ou arabes), rendue unique par un suffixe si besoin.
export function slugDe(titre: string): string {
  const base = titre.normalize("NFD").replace(/[̀-ًͯ-ٰٟ]/g, "").toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return base || "contenu";
}

export interface Depot {
  // limite : nombre maximal de contenus (aucune limite si absent, pour que l'admin voie tout).
  lister(options?: { publiesSeulement?: boolean; type?: TypeContenu; limite?: number }): Promise<Contenu[]>;
  lireParSlug(slug: string): Promise<Contenu | null>;
  lireParId(id: number): Promise<Contenu | null>;
  creer(s: SaisieContenu): Promise<Contenu>;
  modifier(id: number, s: SaisieContenu): Promise<Contenu | null>;
  supprimer(id: number): Promise<Contenu | null>;
}

async function slugLibre(titre: string, pris: (s: string) => Promise<boolean>): Promise<string> {
  const base = slugDe(titre);
  for (let n = 1; n < 1000; n++) {
    const candidat = n === 1 ? base : `${base}-${n}`;
    if (!(await pris(candidat))) return candidat;
  }
  return `${base}-${Date.now()}`;
}

export function depotMemoire(): Depot {
  const lignes: Contenu[] = [];
  let suivant = 1;
  const maintenant = () => new Date().toISOString();
  return {
    async lister(o = {}) {
      return lignes.filter((c) => (!o.publiesSeulement || c.publie) && (!o.type || c.type === o.type))
        .sort((a, b) => (b.publieLe ?? b.creeLe).localeCompare(a.publieLe ?? a.creeLe)).slice(0, o.limite ?? Infinity);
    },
    async lireParSlug(slug) { return lignes.find((c) => c.slug === slug) ?? null; },
    async lireParId(id) { return lignes.find((c) => c.id === id) ?? null; },
    async creer(s) {
      const slug = await slugLibre(s.titre, async (x) => lignes.some((c) => c.slug === x));
      const t = maintenant();
      const c: Contenu = { id: suivant++, slug, ...s, creeLe: t, majLe: t, publieLe: s.publie ? t : null };
      lignes.push(c);
      return c;
    },
    async modifier(id, s) {
      const c = lignes.find((x) => x.id === id);
      if (!c) return null;
      const t = maintenant();
      Object.assign(c, s, { majLe: t, publieLe: s.publie ? c.publieLe ?? t : null });
      return c;
    },
    async supprimer(id) {
      const i = lignes.findIndex((x) => x.id === id);
      return i < 0 ? null : lignes.splice(i, 1)[0]!;
    },
  };
}

type Ligne = { id: number; slug: string; type: TypeContenu; titre: string; resume: string; corps: string; langue: string;
  pdf_url: string | null; pdf_nom: string | null; publie: boolean; cree_le: string | Date; maj_le: string | Date; publie_le: string | Date | null };
const iso = (d: string | Date | null) => (d === null ? null : new Date(d).toISOString());
const versContenu = (l: Ligne): Contenu => ({
  id: l.id, slug: l.slug, type: l.type, titre: l.titre, resume: l.resume, corps: l.corps, langue: l.langue,
  pdfUrl: l.pdf_url, pdfNom: l.pdf_nom, publie: l.publie, creeLe: iso(l.cree_le)!, majLe: iso(l.maj_le)!, publieLe: iso(l.publie_le),
});

export function depotNeon(url: string): Depot {
  const sql = neon(url);
  let pret: Promise<unknown> | null = null;
  // La table est créée au premier usage : rien à faire à la main dans Neon.
  const schema = () => (pret ??= sql`CREATE TABLE IF NOT EXISTS contenus (
    id SERIAL PRIMARY KEY, slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('article','actualite','information')),
    titre TEXT NOT NULL, resume TEXT NOT NULL DEFAULT '', corps TEXT NOT NULL DEFAULT '', langue TEXT NOT NULL DEFAULT 'fr',
    pdf_url TEXT, pdf_nom TEXT, publie BOOLEAN NOT NULL DEFAULT FALSE,
    cree_le TIMESTAMPTZ NOT NULL DEFAULT now(), maj_le TIMESTAMPTZ NOT NULL DEFAULT now(), publie_le TIMESTAMPTZ)`);
  const un = (r: unknown) => ((r as Ligne[])[0] ? versContenu((r as Ligne[])[0]!) : null);
  return {
    async lister(o = {}) {
      await schema();
      const r = await sql`SELECT * FROM contenus
        WHERE (${!o.publiesSeulement} OR publie) AND (${o.type ?? null}::text IS NULL OR type = ${o.type ?? null})
        ORDER BY COALESCE(publie_le, cree_le) DESC LIMIT ${o.limite ?? null}`;
      return (r as Ligne[]).map(versContenu);
    },
    async lireParSlug(slug) { await schema(); return un(await sql`SELECT * FROM contenus WHERE slug = ${slug}`); },
    async lireParId(id) { await schema(); return un(await sql`SELECT * FROM contenus WHERE id = ${id}`); },
    async creer(s) {
      await schema();
      const slug = await slugLibre(s.titre, async (x) => ((await sql`SELECT 1 FROM contenus WHERE slug = ${x}`) as unknown[]).length > 0);
      return un(await sql`INSERT INTO contenus (slug, type, titre, resume, corps, langue, pdf_url, pdf_nom, publie, publie_le)
        VALUES (${slug}, ${s.type}, ${s.titre}, ${s.resume}, ${s.corps}, ${s.langue}, ${s.pdfUrl}, ${s.pdfNom}, ${s.publie},
        CASE WHEN ${s.publie} THEN now() ELSE NULL END) RETURNING *`)!;
    },
    async modifier(id, s) {
      await schema();
      return un(await sql`UPDATE contenus SET type = ${s.type}, titre = ${s.titre}, resume = ${s.resume}, corps = ${s.corps},
        langue = ${s.langue}, pdf_url = ${s.pdfUrl}, pdf_nom = ${s.pdfNom}, publie = ${s.publie}, maj_le = now(),
        publie_le = CASE WHEN ${s.publie} THEN COALESCE(publie_le, now()) ELSE NULL END
        WHERE id = ${id} RETURNING *`);
    },
    async supprimer(id) { await schema(); return un(await sql`DELETE FROM contenus WHERE id = ${id} RETURNING *`); },
  };
}

// Un seul dépôt par serveur : rangé sur globalThis, car les routes et les pages sont chargées séparément.
const global = globalThis as unknown as { __depotContenus?: Depot | null };
// Le dépôt du site, ou null si aucune base n'est configurée (pages « bientôt disponible »).
export function depot(): Depot | null {
  if (global.__depotContenus !== undefined) return global.__depotContenus;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) global.__depotContenus = depotNeon(url);
  else if (process.env.MILAGHAIBA_DEPOT_MEMOIRE === "1" || process.env.NODE_ENV !== "production") global.__depotContenus = depotMemoire();
  else global.__depotContenus = null;
  return global.__depotContenus;
}
