"use client";

// Espace de l'administrateur : écrire, modifier, publier ou retirer articles, actualités et informations (avec PDF).
import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "@/composants/GestionContenus.module.css";

type Type = "article" | "actualite" | "information";
type Contenu = { id: number; slug: string; type: Type; titre: string; resume: string; corps: string; langue: string;
  pdfUrl: string | null; pdfNom: string | null; publie: boolean; majLe: string; publieLe: string | null };
type Etat = { configure: boolean; connecte: boolean; base: boolean; pdf: boolean };
type Brouillon = Omit<Contenu, "id" | "slug" | "majLe" | "publieLe"> & { id?: number };

const TYPES: Record<Type, string> = { article: "Article", actualite: "Actualité", information: "Information" };
const LANGUES: Record<string, string> = { fr: "Français", ar: "العربية", en: "English", es: "Español", ur: "اردو", id: "Indonesia", ms: "Melayu", tr: "Türkçe" };
const ERREURS: Record<string, string> = {
  "mot-de-passe": "Mot de passe incorrect.", trop: "Trop d’essais : réessayez dans 15 minutes.", "non-configure": "Administration non configurée dans Vercel.",
  connexion: "Session expirée : reconnectez-vous.", base: "Base de données non branchée.", stockage: "Stockage des PDF non branché.",
  invalide: "Champs incomplets : titre de 3 caractères au moins.", "trop-gros": "PDF trop lourd (4 Mo au maximum).", "pas-pdf": "Ce fichier n’est pas un PDF.",
  origine: "Requête refusée.", introuvable: "Contenu introuvable.",
};
const vide = (): Brouillon => ({ type: "article", titre: "", resume: "", corps: "", langue: "fr", pdfUrl: null, pdfNom: null, publie: false });

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store" });
  const corps = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(ERREURS[(corps as { erreur?: string }).erreur ?? ""] ?? `Erreur du serveur (${r.status}).`);
  return corps as T;
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export default function GestionContenus({ locale }: { locale: string }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [contenus, setContenus] = useState<Contenu[]>([]);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [mdp, setMdp] = useState("");
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    try {
      const e = await api<Etat>("/api/admin/session");
      setEtat(e);
      if (e.connecte && e.base) setContenus((await api<{ contenus: Contenu[] }>("/api/admin/contenus")).contenus);
    } catch (err) { setMessage({ texte: (err as Error).message, erreur: true }); }
  }, []);
  useEffect(() => { void charger(); }, [charger]);

  const agir = async (action: () => Promise<void>, reussite?: string) => {
    setOccupe(true); setMessage(null);
    try { await action(); if (reussite) setMessage({ texte: reussite }); } catch (err) { setMessage({ texte: (err as Error).message, erreur: true }); }
    finally { setOccupe(false); }
  };

  const connexion = (e: FormEvent) => { e.preventDefault(); void agir(async () => { await api("/api/admin/session", json("POST", { motDePasse: mdp })); setMdp(""); await charger(); }); };
  const deconnexion = () => void agir(async () => { await api("/api/admin/session", { method: "DELETE" }); setBrouillon(null); await charger(); });

  const enregistrer = (e: FormEvent) => {
    e.preventDefault();
    if (!brouillon) return;
    const { id, ...saisie } = brouillon;
    void agir(async () => {
      await api(id ? `/api/admin/contenus/${id}` : "/api/admin/contenus", json(id ? "PUT" : "POST", saisie));
      setBrouillon(null); await charger();
    }, saisie.publie ? "Enregistré et publié." : "Brouillon enregistré (non visible sur le site).");
  };

  const supprimer = (c: Contenu) => {
    if (!window.confirm(`Supprimer définitivement « ${c.titre} » ?`)) return;
    void agir(async () => { await api(`/api/admin/contenus/${c.id}`, { method: "DELETE" }); await charger(); }, "Contenu supprimé.");
  };

  const envoyerPdf = (fichier: File | undefined) => {
    if (!fichier || !brouillon) return;
    const f = new FormData(); f.append("fichier", fichier);
    void agir(async () => {
      const r = await api<{ url: string; nom: string }>("/api/admin/pdf", { method: "POST", body: f });
      setBrouillon((b) => (b ? { ...b, pdfUrl: r.url, pdfNom: r.nom } : b));
    }, "PDF ajouté : pensez à enregistrer.");
  };

  if (!etat) return <p className={styles.note}>Chargement…</p>;
  return (
    <div className={styles.espace}>
      <header className={styles.entete}>
        <p className={styles.surtitre}>Administration</p>
        <h1 className={styles.titre}>Articles, actualités et informations</h1>
        {etat.connecte && <button type="button" className={styles.secondaire} onClick={deconnexion}>Déconnexion</button>}
      </header>
      {message && <p role={message.erreur ? "alert" : "status"} className={message.erreur ? styles.erreur : styles.succes}>{message.texte}</p>}

      {!etat.configure ? (
        <p className={styles.note}>L’administration n’est pas encore configurée : il faut les secrets HADITH_ADMIN_PASSWORD et HADITH_IMPORT_SESSION_SECRET dans Vercel.</p>
      ) : !etat.connecte ? (
        <form className={styles.carte} onSubmit={connexion}>
          <label htmlFor="mdp-admin">Mot de passe administrateur</label>
          <input id="mdp-admin" type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.currentTarget.value)} required />
          <button type="submit" disabled={occupe}>Se connecter</button>
        </form>
      ) : !etat.base ? (
        <p className={styles.note}>La base de données n’est pas encore branchée : ajoutez l’intégration Neon au projet dans Vercel, puis redéployez.</p>
      ) : brouillon ? (
        <form className={styles.carte} onSubmit={enregistrer} aria-label={brouillon.id ? "Modifier le contenu" : "Nouveau contenu"}>
          <div className={styles.ligne}>
            <label>Rubrique
              <select value={brouillon.type} onChange={(e) => setBrouillon({ ...brouillon, type: e.currentTarget.value as Type })}>
                {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>Langue du texte
              <select value={brouillon.langue} onChange={(e) => setBrouillon({ ...brouillon, langue: e.currentTarget.value })}>
                {Object.entries(LANGUES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          <label>Titre<input dir="auto" value={brouillon.titre} maxLength={200} required minLength={3} onChange={(e) => setBrouillon({ ...brouillon, titre: e.currentTarget.value })} /></label>
          <label>Résumé (affiché dans la liste)<textarea dir="auto" rows={2} maxLength={600} value={brouillon.resume} onChange={(e) => setBrouillon({ ...brouillon, resume: e.currentTarget.value })} /></label>
          <label>Texte
            <textarea dir="auto" rows={14} maxLength={60000} value={brouillon.corps} onChange={(e) => setBrouillon({ ...brouillon, corps: e.currentTarget.value })} />
          </label>
          <p className={styles.note}>Mise en forme : une ligne vide entre les paragraphes, « ## » en début de ligne pour un intertitre, **gras**. Les liens https:// deviennent cliquables.</p>
          <div className={styles.ligne}>
            <label>PDF (4 Mo au maximum)
              <input type="file" accept="application/pdf" disabled={!etat.pdf || occupe} onChange={(e) => envoyerPdf(e.currentTarget.files?.[0])} />
            </label>
            {!etat.pdf && <p className={styles.note}>Stockage des PDF non branché (Vercel Blob).</p>}
            {brouillon.pdfUrl && (
              <p className={styles.note}>
                <a href={brouillon.pdfUrl} target="_blank" rel="noopener noreferrer">{brouillon.pdfNom ?? "PDF"}</a>{" "}
                <button type="button" className={styles.lien} onClick={() => setBrouillon({ ...brouillon, pdfUrl: null, pdfNom: null })}>Retirer le PDF</button>
              </p>
            )}
          </div>
          <label className={styles.case}><input type="checkbox" checked={brouillon.publie} onChange={(e) => setBrouillon({ ...brouillon, publie: e.currentTarget.checked })} /> Publier sur le site</label>
          <div className={styles.ligne}>
            <button type="submit" disabled={occupe}>Enregistrer</button>
            <button type="button" className={styles.secondaire} onClick={() => setBrouillon(null)}>Annuler</button>
          </div>
        </form>
      ) : (
        <section className={styles.carte} aria-labelledby="titre-liste">
          <div className={styles.ligne}>
            <h2 id="titre-liste" className={styles.sousTitre}>Contenus ({contenus.length})</h2>
            <button type="button" onClick={() => setBrouillon(vide())}>+ Nouveau contenu</button>
          </div>
          {contenus.length === 0 ? <p className={styles.note}>Aucun contenu pour l’instant.</p> : (
            <ul className={styles.liste}>
              {contenus.map((c) => (
                <li key={c.id} data-contenu={c.slug}>
                  <span className={styles.badge}>{TYPES[c.type]}</span>
                  <bdi dir="auto" className={styles.nom}>{c.titre}</bdi>
                  <span className={c.publie ? styles.publie : styles.brouillon}>{c.publie ? "Publié" : "Brouillon"}</span>
                  {c.publie && <a href={`/${locale}/actualites/${encodeURIComponent(c.slug)}`} target="_blank" rel="noopener noreferrer">Voir</a>}
                  <button type="button" className={styles.lien} onClick={() => { const { slug: _s, majLe: _m, publieLe: _p, ...b } = c; setBrouillon(b); }}>Modifier</button>
                  <button type="button" className={styles.lien} onClick={() => supprimer(c)}>Supprimer</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <p className={styles.note}>Rappel : ne publiez aucun hadith sans sa source, et signalez clairement ce qui reste à vérifier.</p>
    </div>
  );
}
