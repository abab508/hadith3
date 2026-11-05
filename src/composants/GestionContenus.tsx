"use client";

// Espace de l'administrateur : écrire, modifier, publier ou retirer articles, actualités et informations (avec PDF).
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import styles from "@/composants/GestionContenus.module.css";

type Type = "article" | "actualite" | "information";
type Contenu = { id: number; slug: string; type: Type; titre: string; resume: string; corps: string; langue: string;
  pdfUrl: string | null; pdfNom: string | null; publie: boolean; majLe: string; publieLe: string | null };
type Etat = { configure: boolean; connecte: boolean; base: boolean; pdf: boolean };
type Brouillon = Omit<Contenu, "id" | "slug" | "majLe" | "publieLe"> & { id?: number };

const TYPES: Type[] = ["article", "actualite", "information"];
// Codes d'erreur des routes -> clés de traduction (adminContenus.erreurs.*).
const CLES_ERREURS: Record<string, string> = {
  "mot-de-passe": "motDePasse", trop: "trop", "non-configure": "nonConfigure", connexion: "connexion", base: "base", stockage: "stockage",
  invalide: "invalide", "trop-gros": "tropGros", "pas-pdf": "pasPdf", origine: "origine", introuvable: "introuvable",
};
class ErreurApi extends Error { constructor(public cle: string, public statut: number) { super(cle); } }
const vide = (langue: string): Brouillon => ({ type: "article", titre: "", resume: "", corps: "", langue, pdfUrl: null, pdfNom: null, publie: false });

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store" });
  const corps = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErreurApi(CLES_ERREURS[(corps as { erreur?: string }).erreur ?? ""] ?? "serveur", r.status);
  return corps as T;
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export default function GestionContenus({ locale, langues }: { locale: string; langues: { tag: string; nom: string }[] }) {
  const t = useTranslations("adminContenus");
  // Chaque brouillon ouvert reçoit un numéro : un PDF envoyé pour un brouillon ne s'attache jamais à un autre.
  const generation = useRef(0);
  const ouvrir = (b: Brouillon | null) => { generation.current++; setBrouillon(b); };
  const texteErreur = (err: unknown) => (err instanceof ErreurApi ? t(`erreurs.${err.cle}`, { status: err.statut }) : t("erreurs.serveur", { status: 0 }));
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
    } catch (err) { setMessage({ texte: texteErreur(err), erreur: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { void charger(); }, [charger]);

  const agir = async (action: () => Promise<void>, reussite?: string) => {
    setOccupe(true); setMessage(null);
    try { await action(); if (reussite) setMessage({ texte: reussite }); } catch (err) { setMessage({ texte: texteErreur(err), erreur: true }); }
    finally { setOccupe(false); }
  };

  const connexion = (e: FormEvent) => { e.preventDefault(); void agir(async () => { await api("/api/admin/session", json("POST", { motDePasse: mdp })); setMdp(""); await charger(); }); };
  const deconnexion = () => void agir(async () => { await api("/api/admin/session", { method: "DELETE" }); ouvrir(null); await charger(); });

  const enregistrer = (e: FormEvent) => {
    e.preventDefault();
    if (!brouillon) return;
    const { id, ...saisie } = brouillon;
    void agir(async () => {
      await api(id ? `/api/admin/contenus/${id}` : "/api/admin/contenus", json(id ? "PUT" : "POST", saisie));
      ouvrir(null); await charger();
    }, saisie.publie ? t("ok.publie") : t("ok.brouillon"));
  };

  const supprimer = (c: Contenu) => {
    if (!window.confirm(t("confirmerSuppression", { titre: c.titre }))) return;
    void agir(async () => { await api(`/api/admin/contenus/${c.id}`, { method: "DELETE" }); await charger(); }, t("ok.supprime"));
  };

  const envoyerPdf = (fichier: File | undefined) => {
    if (!fichier || !brouillon) return;
    const f = new FormData(); f.append("fichier", fichier);
    const pour = generation.current;
    setMessage({ texte: t("envoiPdf") });
    void agir(async () => {
      const r = await api<{ url: string; nom: string }>("/api/admin/pdf", { method: "POST", body: f });
      // Brouillon fermé ou changé pendant l'envoi : on n'attache pas ce PDF ailleurs.
      if (generation.current !== pour) return;
      setBrouillon((b) => (b ? { ...b, pdfUrl: r.url, pdfNom: r.nom } : b));
    }, t("ok.pdf"));
  };

  if (!etat) return <p className={styles.note}>{t("chargement")}</p>;
  return (
    <div className={styles.espace}>
      <header className={styles.entete}>
        <p className={styles.surtitre}>{t("surtitre")}</p>
        <h1 className={styles.titre}>{t("titre")}</h1>
        {etat.connecte && <button type="button" className={styles.secondaire} onClick={deconnexion}>{t("deconnexion")}</button>}
      </header>
      {message && <p role={message.erreur ? "alert" : "status"} className={message.erreur ? styles.erreur : styles.succes}>{message.texte}</p>}

      {!etat.configure ? (
        <p className={styles.note}>{t("nonConfigure")}</p>
      ) : !etat.connecte ? (
        <form className={styles.carte} onSubmit={connexion}>
          <label htmlFor="mdp-admin">{t("motDePasse")}</label>
          <input id="mdp-admin" type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.currentTarget.value)} required />
          <button type="submit" disabled={occupe}>{t("seConnecter")}</button>
        </form>
      ) : !etat.base ? (
        <p className={styles.note}>{t("baseAbsente")}</p>
      ) : brouillon ? (
        <form className={styles.carte} onSubmit={enregistrer} aria-label={brouillon.id ? t("formModifier") : t("formNouveau")}>
          <div className={styles.ligne}>
            <label>{t("rubrique")}
              <select value={brouillon.type} onChange={(e) => setBrouillon({ ...brouillon, type: e.currentTarget.value as Type })}>
                {TYPES.map((v) => <option key={v} value={v}>{t(`types.${v}`)}</option>)}
              </select>
            </label>
            <label>{t("langue")}
              <select value={brouillon.langue} onChange={(e) => setBrouillon({ ...brouillon, langue: e.currentTarget.value })}>
                {langues.map((l) => <option key={l.tag} value={l.tag}>{l.nom}</option>)}
              </select>
            </label>
          </div>
          <label>{t("champTitre")}<input dir="auto" value={brouillon.titre} maxLength={200} required minLength={3} onChange={(e) => setBrouillon({ ...brouillon, titre: e.currentTarget.value })} /></label>
          <label>{t("resume")}<textarea dir="auto" rows={2} maxLength={600} value={brouillon.resume} onChange={(e) => setBrouillon({ ...brouillon, resume: e.currentTarget.value })} /></label>
          <label>{t("texte")}
            <textarea dir="auto" rows={14} maxLength={60000} value={brouillon.corps} onChange={(e) => setBrouillon({ ...brouillon, corps: e.currentTarget.value })} />
          </label>
          <p className={styles.note}>{t("aideMiseEnForme")}</p>
          <div className={styles.ligne}>
            <label>{t("pdf")}
              <input type="file" accept="application/pdf" disabled={!etat.pdf || occupe} onChange={(e) => envoyerPdf(e.currentTarget.files?.[0])} />
            </label>
            {!etat.pdf && <p className={styles.note}>{t("pdfAbsent")}</p>}
            {brouillon.pdfUrl && (
              <p className={styles.note}>
                <a href={`/api/pdf?u=${encodeURIComponent(brouillon.pdfUrl)}`} target="_blank" rel="noopener noreferrer">{brouillon.pdfNom ?? "PDF"}</a>{" "}
                <button type="button" className={styles.lien} onClick={() => setBrouillon({ ...brouillon, pdfUrl: null, pdfNom: null })}>{t("retirerPdf")}</button>
              </p>
            )}
          </div>
          <label className={styles.case}><input type="checkbox" checked={brouillon.publie} onChange={(e) => setBrouillon({ ...brouillon, publie: e.currentTarget.checked })} /> {t("publier")}</label>
          <div className={styles.ligne}>
            <button type="submit" disabled={occupe}>{t("enregistrer")}</button>
            <button type="button" className={styles.secondaire} onClick={() => ouvrir(null)}>{t("annuler")}</button>
          </div>
        </form>
      ) : (
        <section className={styles.carte} aria-labelledby="titre-liste">
          <div className={styles.ligne}>
            <h2 id="titre-liste" className={styles.sousTitre}>{t("contenus", { n: contenus.length })}</h2>
            <button type="button" onClick={() => ouvrir(vide(langues.some((l) => l.tag === locale) ? locale : langues[0]?.tag ?? locale))}>{t("nouveau")}</button>
          </div>
          {contenus.length === 0 ? <p className={styles.note}>{t("aucun")}</p> : (
            <ul className={styles.liste}>
              {contenus.map((c) => (
                <li key={c.id} data-contenu={c.slug}>
                  <span className={styles.badge}>{t(`types.${c.type}`)}</span>
                  <bdi dir="auto" className={styles.nom}>{c.titre}</bdi>
                  <span className={c.publie ? styles.publie : styles.brouillon}>{c.publie ? t("publie") : t("brouillon")}</span>
                  {c.publie && <a href={`/${locale}/actualites/${encodeURIComponent(c.slug)}`} target="_blank" rel="noopener noreferrer">{t("voir")}</a>}
                  <button type="button" className={styles.lien} onClick={() => { const { slug: _s, majLe: _m, publieLe: _p, ...b } = c; ouvrir(b); }}>{t("modifier")}</button>
                  <button type="button" className={styles.lien} onClick={() => supprimer(c)}>{t("supprimer")}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <p className={styles.note}>{t("rappel")}</p>
    </div>
  );
}
