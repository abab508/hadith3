/**
 * Données du forum : membres (sur invitation), mots interdits, discussions et messages.
 * Même stockage que les contenus : Neon (DATABASE_URL / POSTGRES_URL, tables créées au premier usage),
 * ou dépôt en mémoire hors production / pour les tests (MILAGHAIBA_DEPOT_MEMOIRE=1).
 */
import { neon } from "@neondatabase/serverless";

export type StatutMembre = "actif" | "bloque";
export type StatutMessage = "publie" | "retenu" | "masque";
// version : augmente à chaque changement de mot de passe ; une session d'une version plus ancienne n'est plus valable.
export type Membre = { id: number; email: string; nom: string; statut: StatutMembre; creeLe: string; version: number };
export type MembreInterne = Membre & { hash: string };
export type Invitation = { code: string; note: string; creeLe: string; utiliseLe: string | null; membreId: number | null };
// enAttente : le premier message est retenu par le filtre, la discussion reste cachée jusqu'à décision de l'admin.
export type Sujet = { id: number; titre: string; auteurId: number; auteurNom: string; ferme: boolean; masque: boolean; enAttente: boolean;
  creeLe: string; dernierLe: string; nbMessages: number };
export type Message = { id: number; sujetId: number; auteurId: number; auteurNom: string; corps: string; statut: StatutMessage; motsTrouves: string[]; creeLe: string };
export type Inscription = { code: string; email: string; nom: string; hash: string };
export type ResultatInscription = { ok: true; membre: Membre } | { ok: false; raison: "code" | "email" | "nom" };
// Quota par membre : au plus n messages (discussions comprises) sur la fenêtre, vérifié en même temps que l'ajout.
export type Quota = { n: number; fenetreMs: number };

export interface DepotForum {
  creerInvitation(code: string, note: string): Promise<Invitation>;
  listerInvitations(): Promise<Invitation[]>;
  inscrire(i: Inscription): Promise<ResultatInscription>;
  membreParEmail(email: string): Promise<MembreInterne | null>;
  membreParId(id: number): Promise<Membre | null>;
  listerMembres(): Promise<Membre[]>;
  changerStatut(id: number, statut: StatutMembre): Promise<boolean>;
  changerMotDePasse(id: number, hash: string): Promise<boolean>;
  listerMots(): Promise<string[]>;
  ajouterMot(mot: string): Promise<void>;
  retirerMot(mot: string): Promise<void>;
  // Vue publique : discussions visibles (ni masquées ni en attente) ; vue admin : toutes.
  listerSujets(admin: boolean): Promise<Sujet[]>;
  sujet(id: number, admin: boolean): Promise<Sujet | null>;
  // La discussion et son premier message sont créés ensemble (ou pas du tout) ; null si le quota est atteint.
  creerSujet(auteurId: number, titre: string, corps: string, statut: StatutMessage, mots: string[], quota: Quota): Promise<{ sujet: Sujet; message: Message } | null>;
  // Messages visibles : publiés, plus ceux du lecteur retenus (il voit qu'ils attendent) ; l'admin voit tout.
  messages(sujetId: number, lecteurId: number | null, admin: boolean): Promise<Message[]>;
  // null si le quota est atteint.
  ajouterMessage(sujetId: number, auteurId: number, corps: string, statut: StatutMessage, mots: string[], quota: Quota): Promise<Message | null>;
  modererMessage(id: number, statut: StatutMessage): Promise<boolean>;
  modererSujet(id: number, changement: { ferme?: boolean; masque?: boolean }): Promise<boolean>;
  messagesRetenus(): Promise<(Message & { sujetTitre: string })[]>;
}

const maintenant = () => new Date().toISOString();
export const emailNormal = (e: string) => e.trim().toLowerCase();

export function depotForumMemoire(): DepotForum {
  const membres: MembreInterne[] = [], invitations: Invitation[] = [], mots = new Set<string>();
  const sujets: Omit<Sujet, "auteurNom" | "nbMessages">[] = [], messages: Omit<Message, "auteurNom">[] = [];
  let idM = 1, idS = 1, idMsg = 1;
  const nom = (id: number) => membres.find((m) => m.id === id)?.nom ?? "?";
  const publique = ({ hash: _h, ...m }: MembreInterne): Membre => m;
  const complet = (s: Omit<Sujet, "auteurNom" | "nbMessages">): Sujet =>
    ({ ...s, auteurNom: nom(s.auteurId), nbMessages: messages.filter((m) => m.sujetId === s.id && m.statut === "publie").length });
  const visible = (s: { masque: boolean; enAttente: boolean }) => !s.masque && !s.enAttente;
  const recents = (auteurId: number, fenetreMs: number) =>
    messages.filter((m) => m.auteurId === auteurId && Date.now() - new Date(m.creeLe).getTime() < fenetreMs).length;
  return {
    async creerInvitation(code, note) { const i = { code, note, creeLe: maintenant(), utiliseLe: null, membreId: null }; invitations.push(i); return i; },
    async listerInvitations() { return [...invitations].reverse(); },
    async inscrire({ code, email, nom: n, hash }) {
      const inv = invitations.find((i) => i.code === code && !i.utiliseLe);
      if (!inv) return { ok: false, raison: "code" };
      if (membres.some((m) => m.email === emailNormal(email))) return { ok: false, raison: "email" };
      if (membres.some((m) => m.nom.toLowerCase() === n.toLowerCase())) return { ok: false, raison: "nom" };
      const m: MembreInterne = { id: idM++, email: emailNormal(email), nom: n, statut: "actif", creeLe: maintenant(), version: 0, hash };
      membres.push(m);
      inv.utiliseLe = maintenant(); inv.membreId = m.id;
      return { ok: true, membre: publique(m) };
    },
    async membreParEmail(email) { return membres.find((m) => m.email === emailNormal(email)) ?? null; },
    async membreParId(id) { const m = membres.find((x) => x.id === id); return m ? publique(m) : null; },
    async listerMembres() { return membres.map(publique).reverse(); },
    async changerStatut(id, statut) { const m = membres.find((x) => x.id === id); if (m) m.statut = statut; return Boolean(m); },
    async changerMotDePasse(id, hash) { const m = membres.find((x) => x.id === id); if (m) { m.hash = hash; m.version++; } return Boolean(m); },
    async listerMots() { return [...mots].sort(); },
    async ajouterMot(mot) { mots.add(mot); },
    async retirerMot(mot) { mots.delete(mot); },
    async listerSujets(admin) {
      return sujets.filter((s) => admin || visible(s)).map(complet).sort((a, b) => b.dernierLe.localeCompare(a.dernierLe));
    },
    async sujet(id, admin) { const s = sujets.find((x) => x.id === id); return s && (admin || visible(s)) ? complet(s) : null; },
    // Aucune attente entre le comptage et l'ajout : en mémoire, l'opération ne peut pas être doublée.
    async creerSujet(auteurId, titre, corps, statut, trouves, quota) {
      if (recents(auteurId, quota.fenetreMs) >= quota.n) return null;
      const t = maintenant();
      const s = { id: idS++, titre, auteurId, ferme: false, masque: false, enAttente: statut === "retenu", creeLe: t, dernierLe: t };
      sujets.push(s);
      const m = { id: idMsg++, sujetId: s.id, auteurId, corps, statut, motsTrouves: trouves, creeLe: t };
      messages.push(m);
      return { sujet: complet(s), message: { ...m, auteurNom: nom(auteurId) } };
    },
    async messages(sujetId, lecteurId, admin) {
      return messages.filter((m) => m.sujetId === sujetId && (admin || m.statut === "publie" || (m.statut === "retenu" && m.auteurId === lecteurId)))
        .map((m) => ({ ...m, auteurNom: nom(m.auteurId) }));
    },
    async ajouterMessage(sujetId, auteurId, corps, statut, trouves, quota) {
      if (recents(auteurId, quota.fenetreMs) >= quota.n) return null;
      const m = { id: idMsg++, sujetId, auteurId, corps, statut, motsTrouves: trouves, creeLe: maintenant() };
      messages.push(m);
      const s = sujets.find((x) => x.id === sujetId);
      if (s && statut === "publie") s.dernierLe = m.creeLe;
      return { ...m, auteurNom: nom(auteurId) };
    },
    async modererMessage(id, statut) {
      const m = messages.find((x) => x.id === id);
      if (!m) return false;
      m.statut = statut;
      const s = sujets.find((x) => x.id === m.sujetId);
      // Un message accepté remet la discussion en tête (sans jamais reculer sa date).
      if (s && statut === "publie") { const t = maintenant(); if (t > s.dernierLe) s.dernierLe = t; }
      // La discussion attendait la décision sur son premier message : elle est tranchée.
      if (s?.enAttente && messages.find((x) => x.sujetId === s.id)?.id === m.id) {
        s.enAttente = false;
        if (statut !== "publie") s.masque = true;
      }
      return true;
    },
    async modererSujet(id, c) {
      const s = sujets.find((x) => x.id === id);
      if (!s) return false;
      if (c.ferme !== undefined) s.ferme = c.ferme;
      if (c.masque !== undefined) s.masque = c.masque;
      return true;
    },
    async messagesRetenus() {
      return messages.filter((m) => m.statut === "retenu")
        .map((m) => ({ ...m, auteurNom: nom(m.auteurId), sujetTitre: sujets.find((s) => s.id === m.sujetId)?.titre ?? "" }));
    },
  };
}

type L = Record<string, unknown>;
const iso = (d: unknown) => (d === null || d === undefined ? null : new Date(d as string).toISOString());
const vMembre = (l: L): MembreInterne => ({ id: l.id as number, email: l.email as string, nom: l.nom as string,
  statut: l.statut as StatutMembre, creeLe: iso(l.cree_le)!, version: Number(l.version ?? 0), hash: l.hash as string });
const vInvitation = (l: L): Invitation => ({ code: l.code as string, note: l.note as string, creeLe: iso(l.cree_le)!,
  utiliseLe: iso(l.utilise_le), membreId: (l.membre_id as number | null) ?? null });
const vSujet = (l: L): Sujet => ({ id: l.id as number, titre: l.titre as string, auteurId: l.auteur_id as number, auteurNom: l.auteur_nom as string,
  ferme: l.ferme as boolean, masque: l.masque as boolean, enAttente: l.en_attente as boolean, creeLe: iso(l.cree_le)!, dernierLe: iso(l.dernier_le)!,
  nbMessages: Number(l.nb_messages ?? 0) });
const vMessage = (l: L): Message => ({ id: l.id as number, sujetId: l.sujet_id as number, auteurId: l.auteur_id as number, auteurNom: l.auteur_nom as string,
  corps: l.corps as string, statut: l.statut as StatutMessage, motsTrouves: (l.mots_trouves as string[] | null) ?? [], creeLe: iso(l.cree_le)! });
const publique = ({ hash: _h, ...m }: MembreInterne): Membre => m;

export function depotForumNeon(url: string): DepotForum {
  const sql = neon(url);
  let pret: Promise<unknown> | null = null;
  const schema = () => (pret ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS forum_membres (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, nom TEXT NOT NULL,
      hash TEXT NOT NULL, statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','bloque')), cree_le TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS forum_membres_nom ON forum_membres (lower(nom))`;
    await sql`ALTER TABLE forum_membres ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0`;
    await sql`CREATE TABLE IF NOT EXISTS forum_invitations (code TEXT PRIMARY KEY, note TEXT NOT NULL DEFAULT '',
      cree_le TIMESTAMPTZ NOT NULL DEFAULT now(), utilise_le TIMESTAMPTZ, membre_id INTEGER REFERENCES forum_membres(id))`;
    await sql`CREATE TABLE IF NOT EXISTS forum_mots (mot TEXT PRIMARY KEY)`;
    await sql`CREATE TABLE IF NOT EXISTS forum_sujets (id SERIAL PRIMARY KEY, titre TEXT NOT NULL, auteur_id INTEGER NOT NULL REFERENCES forum_membres(id),
      ferme BOOLEAN NOT NULL DEFAULT FALSE, masque BOOLEAN NOT NULL DEFAULT FALSE, en_attente BOOLEAN NOT NULL DEFAULT FALSE,
      cree_le TIMESTAMPTZ NOT NULL DEFAULT now(), dernier_le TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS forum_messages (id SERIAL PRIMARY KEY, sujet_id INTEGER NOT NULL REFERENCES forum_sujets(id),
      auteur_id INTEGER NOT NULL REFERENCES forum_membres(id), corps TEXT NOT NULL,
      statut TEXT NOT NULL CHECK (statut IN ('publie','retenu','masque')), mots_trouves TEXT[] NOT NULL DEFAULT '{}',
      cree_le TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE INDEX IF NOT EXISTS forum_messages_sujet ON forum_messages (sujet_id, id)`;
  })());
  const lignes = async (r: Promise<unknown>) => (await r) as L[];
  const sujetSql = (filtre: ReturnType<typeof sql>) => sql`SELECT s.*, m.nom AS auteur_nom,
      (SELECT count(*) FROM forum_messages x WHERE x.sujet_id = s.id AND x.statut = 'publie') AS nb_messages
    FROM forum_sujets s JOIN forum_membres m ON m.id = s.auteur_id ${filtre}`;
  return {
    async creerInvitation(code, note) {
      await schema();
      return vInvitation((await lignes(sql`INSERT INTO forum_invitations (code, note) VALUES (${code}, ${note}) RETURNING *`))[0]!);
    },
    async listerInvitations() { await schema(); return (await lignes(sql`SELECT * FROM forum_invitations ORDER BY cree_le DESC LIMIT 200`)).map(vInvitation); },
    async inscrire({ code, email, nom, hash }) {
      await schema();
      const inv = await lignes(sql`SELECT code FROM forum_invitations WHERE code = ${code} AND utilise_le IS NULL`);
      if (!inv[0]) return { ok: false, raison: "code" };
      if ((await lignes(sql`SELECT 1 FROM forum_membres WHERE email = ${emailNormal(email)}`))[0]) return { ok: false, raison: "email" };
      if ((await lignes(sql`SELECT 1 FROM forum_membres WHERE lower(nom) = lower(${nom})`))[0]) return { ok: false, raison: "nom" };
      // Une seule requête : le code n'est consommé qu'une fois, même si deux inscriptions arrivent en même temps
      // (et rien n'est consommé si l'ajout du membre échoue).
      const r = await lignes(sql`WITH inv AS (UPDATE forum_invitations SET utilise_le = now() WHERE code = ${code} AND utilise_le IS NULL RETURNING code)
        INSERT INTO forum_membres (email, nom, hash) SELECT ${emailNormal(email)}, ${nom}, ${hash} FROM inv RETURNING *`).catch(() => []);
      const ligne = r[0];
      if (!ligne) return { ok: false, raison: "code" };
      await sql`UPDATE forum_invitations SET membre_id = ${ligne.id as number} WHERE code = ${code}`;
      return { ok: true, membre: publique(vMembre(ligne)) };
    },
    async membreParEmail(email) { await schema(); const l = (await lignes(sql`SELECT * FROM forum_membres WHERE email = ${emailNormal(email)}`))[0]; return l ? vMembre(l) : null; },
    async membreParId(id) { await schema(); const l = (await lignes(sql`SELECT * FROM forum_membres WHERE id = ${id}`))[0]; return l ? publique(vMembre(l)) : null; },
    async listerMembres() { await schema(); return (await lignes(sql`SELECT * FROM forum_membres ORDER BY id DESC`)).map((l) => publique(vMembre(l))); },
    async changerStatut(id, statut) { await schema(); return (await lignes(sql`UPDATE forum_membres SET statut = ${statut} WHERE id = ${id} RETURNING id`)).length > 0; },
    async changerMotDePasse(id, hash) { await schema(); return (await lignes(sql`UPDATE forum_membres SET hash = ${hash}, version = version + 1 WHERE id = ${id} RETURNING id`)).length > 0; },
    async listerMots() { await schema(); return (await lignes(sql`SELECT mot FROM forum_mots ORDER BY mot`)).map((l) => l.mot as string); },
    async ajouterMot(mot) { await schema(); await sql`INSERT INTO forum_mots (mot) VALUES (${mot}) ON CONFLICT DO NOTHING`; },
    async retirerMot(mot) { await schema(); await sql`DELETE FROM forum_mots WHERE mot = ${mot}`; },
    async listerSujets(admin) {
      await schema();
      return (await lignes(sujetSql(admin ? sql`` : sql`WHERE NOT s.masque AND NOT s.en_attente`))).map(vSujet)
        .sort((a, b) => b.dernierLe.localeCompare(a.dernierLe));
    },
    async sujet(id, admin) {
      await schema();
      const l = (await lignes(sujetSql(admin ? sql`WHERE s.id = ${id}` : sql`WHERE s.id = ${id} AND NOT s.masque AND NOT s.en_attente`)))[0];
      return l ? vSujet(l) : null;
    },
    // Verrou par membre (pg_advisory_xact_lock) puis comptage et ajout dans la même transaction :
    // des envois simultanés ne peuvent pas dépasser le quota. La discussion et son premier message
    // sont insérés par une seule requête : si le message échoue, la discussion n'existe pas.
    async creerSujet(auteurId, titre, corps, statut, trouves, quota) {
      await schema();
      const [, r] = await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(4242, ${auteurId})`,
        sql`WITH ok AS (SELECT 1 WHERE (SELECT count(*) FROM forum_messages WHERE auteur_id = ${auteurId}
              AND cree_le > now() - (${quota.fenetreMs} || ' milliseconds')::interval) < ${quota.n}),
            s AS (INSERT INTO forum_sujets (titre, auteur_id, en_attente) SELECT ${titre}, ${auteurId}, ${statut === "retenu"} FROM ok RETURNING id),
            m AS (INSERT INTO forum_messages (sujet_id, auteur_id, corps, statut, mots_trouves)
              SELECT s.id, ${auteurId}, ${corps}, ${statut}, ${trouves} FROM s RETURNING id, sujet_id)
            SELECT sujet_id, id FROM m`,
      ]);
      const ligne = (r as L[])[0];
      if (!ligne) return null;
      const sujet = (await this.sujet(ligne.sujet_id as number, true))!;
      const message = (await this.messages(sujet.id, null, true)).find((x) => x.id === (ligne.id as number))!;
      return { sujet, message };
    },
    async messages(sujetId, lecteurId, admin) {
      await schema();
      return (await lignes(sql`SELECT x.*, m.nom AS auteur_nom FROM forum_messages x JOIN forum_membres m ON m.id = x.auteur_id
        WHERE x.sujet_id = ${sujetId} AND (${admin} OR x.statut = 'publie' OR (x.statut = 'retenu' AND x.auteur_id = ${lecteurId}))
        ORDER BY x.id`)).map(vMessage);
    },
    async ajouterMessage(sujetId, auteurId, corps, statut, trouves, quota) {
      await schema();
      const [, r] = await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(4242, ${auteurId})`,
        sql`INSERT INTO forum_messages (sujet_id, auteur_id, corps, statut, mots_trouves)
          SELECT ${sujetId}, ${auteurId}, ${corps}, ${statut}, ${trouves}
          WHERE (SELECT count(*) FROM forum_messages WHERE auteur_id = ${auteurId}
            AND cree_le > now() - (${quota.fenetreMs} || ' milliseconds')::interval) < ${quota.n}
          RETURNING *, (SELECT nom FROM forum_membres WHERE id = ${auteurId}) AS auteur_nom`,
      ]);
      const l = (r as L[])[0];
      if (!l) return null;
      if (statut === "publie") await sql`UPDATE forum_sujets SET dernier_le = now() WHERE id = ${sujetId}`;
      return vMessage(l);
    },
    async modererMessage(id, statut) {
      await schema();
      const l = (await lignes(sql`UPDATE forum_messages SET statut = ${statut} WHERE id = ${id} RETURNING sujet_id`))[0];
      if (!l) return false;
      // Un message accepté remet la discussion en tête (GREATEST : la date ne recule jamais).
      if (statut === "publie") await sql`UPDATE forum_sujets SET dernier_le = GREATEST(dernier_le, now()) WHERE id = ${l.sujet_id as number}`;
      const premier = (await lignes(sql`SELECT min(id) AS id FROM forum_messages WHERE sujet_id = ${l.sujet_id as number}`))[0];
      if (premier?.id === id) {
        await sql`UPDATE forum_sujets SET en_attente = FALSE, masque = CASE WHEN en_attente AND ${statut} <> 'publie' THEN TRUE ELSE masque END
          WHERE id = ${l.sujet_id as number}`;
      }
      return true;
    },
    async modererSujet(id, c) {
      await schema();
      const r = await lignes(sql`UPDATE forum_sujets SET ferme = COALESCE(${c.ferme ?? null}::boolean, ferme), masque = COALESCE(${c.masque ?? null}::boolean, masque)
        WHERE id = ${id} RETURNING id`);
      return r.length > 0;
    },
    async messagesRetenus() {
      await schema();
      return (await lignes(sql`SELECT x.*, m.nom AS auteur_nom, s.titre AS sujet_titre FROM forum_messages x
        JOIN forum_membres m ON m.id = x.auteur_id JOIN forum_sujets s ON s.id = x.sujet_id WHERE x.statut = 'retenu' ORDER BY x.id`))
        .map((l) => ({ ...vMessage(l), sujetTitre: l.sujet_titre as string }));
    },
  };
}

// Un seul dépôt par serveur (routes et pages sont chargées séparément).
const global = globalThis as unknown as { __depotForum?: DepotForum | null };
export function depotForum(): DepotForum | null {
  if (global.__depotForum !== undefined) return global.__depotForum;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) global.__depotForum = depotForumNeon(url);
  else if (process.env.MILAGHAIBA_DEPOT_MEMOIRE === "1" || process.env.NODE_ENV !== "production") global.__depotForum = depotForumMemoire();
  else global.__depotForum = null;
  return global.__depotForum;
}
