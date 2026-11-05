"use client";

// Espace de modération : messages retenus, discussions, membres, invitations et mots interdits.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import styles from "@/app/[locale]/forum/Forum.module.css";

type Membre = { id: number; email: string; nom: string; statut: "actif" | "bloque"; creeLe: string };
type Invitation = { code: string; note: string; creeLe: string; utiliseLe: string | null };
type Sujet = { id: number; titre: string; auteurNom: string; ferme: boolean; masque: boolean; enAttente: boolean; nbMessages: number };
type Retenu = { id: number; sujetId: number; sujetTitre: string; auteurNom: string; corps: string; motsTrouves: string[] };
type Donnees = { retenus: Retenu[]; membres: Membre[]; invitations: Invitation[]; mots: string[]; sujets: Sujet[] };
type Onglet = "retenus" | "discussions" | "membres" | "invitations" | "mots";
const CLES: Record<string, string> = { "mot-de-passe": "motDePasse", "non-configure": "nonConfigure" };

export default function ModerationForum({ locale }: { locale: string }) {
  const t = useTranslations("adminForum");
  const [etat, setEtat] = useState<{ configure: boolean; connecte: boolean; base: boolean } | null>(null);
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("retenus");
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean } | null>(null);
  const [mdp, setMdp] = useState(""), [note, setNote] = useState(""), [mot, setMot] = useState("");
  const [occupe, setOccupe] = useState(false);

  const appel = useCallback(async (url: string, init?: RequestInit) => {
    const r = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store", headers: { "content-type": "application/json" } });
    const corps = await r.json().catch(() => ({})) as Record<string, unknown>;
    if (!r.ok) {
      const cle = CLES[String(corps.erreur)] ?? String(corps.erreur ?? "serveur");
      throw new Error(t.has(`erreurs.${cle}`) ? t(`erreurs.${cle}`) : t("erreurs.serveur", { status: r.status }));
    }
    return corps;
  }, [t]);

  const charger = useCallback(async () => {
    try {
      const e = await appel("/api/admin/session") as { configure: boolean; connecte: boolean; base: boolean };
      setEtat(e);
      if (e.connecte && e.base) setDonnees(await appel("/api/admin/forum") as unknown as Donnees);
    } catch (err) { setMessage({ texte: (err as Error).message, erreur: true }); }
  }, [appel]);
  useEffect(() => { void charger(); }, [charger]);

  const agir = async (corps: Record<string, unknown>, apres?: (r: Record<string, unknown>) => void) => {
    setOccupe(true); setMessage(null);
    try { const r = await appel("/api/admin/forum", { method: "POST", body: JSON.stringify(corps) }); apres?.(r); await charger(); }
    catch (err) { setMessage({ texte: (err as Error).message, erreur: true }); }
    finally { setOccupe(false); }
  };
  const connexion = async (e: FormEvent) => {
    e.preventDefault(); setOccupe(true); setMessage(null);
    try { await appel("/api/admin/session", { method: "POST", body: JSON.stringify({ motDePasse: mdp }) }); setMdp(""); await charger(); }
    catch (err) { setMessage({ texte: (err as Error).message, erreur: true }); }
    finally { setOccupe(false); }
  };

  const Alerte = () => (message ? <p role={message.erreur ? "alert" : "status"} className={message.erreur ? styles.erreur : styles.succes}>{message.texte}</p> : null);
  if (!etat) return <p className={styles.note}>{t("chargement")}</p>;

  return (
    <div className={styles.page}>
      <p className={styles.surtitre}>{t("surtitre")}</p>
      <h1 className={styles.titre}>{t("titre")}</h1>
      <Alerte />
      {!etat.configure ? <p className={styles.note}>{t("erreurs.nonConfigure")}</p>
        : !etat.connecte ? (
          <form className={styles.carte} onSubmit={connexion}>
            <label>{t("motDePasse")}<input type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.currentTarget.value)} required /></label>
            <button type="submit" disabled={occupe}>{t("seConnecter")}</button>
          </form>
        ) : !etat.base || !donnees ? <p className={styles.note}>{t("erreurs.base")}</p> : (
          <>
            <div className={styles.onglets} role="tablist">
              {(["retenus", "discussions", "membres", "invitations", "mots"] as const).map((o) => (
                <button key={o} type="button" role="tab" aria-selected={onglet === o} onClick={() => setOnglet(o)}>
                  {t(`onglets.${o}`, { n: o === "retenus" ? donnees.retenus.length : 0 })}
                </button>
              ))}
            </div>

            {onglet === "retenus" && (donnees.retenus.length === 0 ? <p className={styles.vide}>{t("aucunRetenu")}</p> : (
              <ul className={styles.liste}>
                {donnees.retenus.map((m) => (
                  <li key={m.id} className={styles.message} data-retenu={m.id}>
                    <span className={styles.meta}><bdi dir="auto">{t("dans", { titre: m.sujetTitre })}</bdi> · <bdi dir="auto">{t("par", { nom: m.auteurNom })}</bdi></span>
                    <p dir="auto">{m.corps}</p>
                    <span className={styles.note}>{t("motsTrouves", { mots: m.motsTrouves.join(", ") })}</span>
                    <span className={styles.ligne}>
                      <button type="button" className={styles.secondaire} disabled={occupe} onClick={() => void agir({ action: "publierMessage", id: m.id })}>{t("publier")}</button>
                      <button type="button" className={styles.secondaire} disabled={occupe} onClick={() => void agir({ action: "masquerMessage", id: m.id })}>{t("laisserMasque")}</button>
                    </span>
                  </li>
                ))}
              </ul>
            ))}

            {onglet === "discussions" && (
              <ul className={styles.tableau}>
                {donnees.sujets.map((s) => (
                  <li key={s.id} data-sujet={s.id}>
                    <bdi dir="auto" className={styles.nomSujet}>{s.titre}</bdi>
                    <span className={styles.meta}>
                      <bdi dir="auto">{t("par", { nom: s.auteurNom })}</bdi>
                      {s.ferme && <span className={styles.badge}>{t("ferme")}</span>}
                      {s.masque && <span className={styles.badge}>{t("masque")}</span>}
                      {s.enAttente && <span className={styles.badge}>{t("enAttente")}</span>}
                    </span>
                    {!s.masque && !s.enAttente && <a href={`/${locale}/forum/${s.id}`} target="_blank" rel="noopener noreferrer">{t("voir")}</a>}
                    <button type="button" className={styles.lien} disabled={occupe} onClick={() => void agir({ action: s.ferme ? "rouvrir" : "fermer", id: s.id })}>{s.ferme ? t("rouvrir") : t("fermer")}</button>
                    <button type="button" className={styles.lien} disabled={occupe} onClick={() => void agir({ action: s.masque ? "afficherSujet" : "masquerSujet", id: s.id })}>{s.masque ? t("afficher") : t("masquerSujet")}</button>
                  </li>
                ))}
              </ul>
            )}

            {onglet === "membres" && (
              <ul className={styles.tableau}>
                {donnees.membres.map((m) => (
                  <li key={m.id} data-membre={m.id}>
                    <bdi dir="auto" className={styles.badge}>{m.nom}</bdi>
                    <span className={styles.note}>{m.email}</span>
                    <span className={styles.note}>{m.statut === "bloque" ? t("bloque") : t("actif")}</span>
                    <button type="button" className={styles.lien} disabled={occupe} onClick={() => void agir({ action: m.statut === "bloque" ? "debloquer" : "bloquer", id: m.id })}>{m.statut === "bloque" ? t("debloquer") : t("bloquer")}</button>
                    <button type="button" className={styles.lien} disabled={occupe}
                      onClick={() => void agir({ action: "reinitialiser", id: m.id }, (r) => setMessage({ texte: t("nouveauMdp", { nom: m.nom, mdp: String(r.motDePasse) }) }))}>{t("reinitialiser")}</button>
                  </li>
                ))}
              </ul>
            )}

            {onglet === "invitations" && (
              <>
                <form className={styles.carte} onSubmit={(e) => { e.preventDefault(); void agir({ action: "inviter", note }, () => setNote("")); }}>
                  <label>{t("note")}<input dir="auto" maxLength={120} value={note} onChange={(e) => setNote(e.currentTarget.value)} /></label>
                  <button type="submit" disabled={occupe}>{t("creerCode")}</button>
                </form>
                <ul className={styles.tableau}>
                  {donnees.invitations.map((i) => (
                    <li key={i.code} data-invitation={i.code}>
                      <span className={styles.code}>{i.code}</span>
                      {i.note && <bdi dir="auto" className={styles.note}>{i.note}</bdi>}
                      <span className={styles.badge}>{i.utiliseLe ? t("utilise") : t("libre")}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {onglet === "mots" && (
              <>
                <p className={styles.note}>{t("aideMots")}</p>
                <form className={styles.carte} onSubmit={(e) => { e.preventDefault(); void agir({ action: "ajouterMot", mot }, () => setMot("")); }}>
                  <label>{t("mot")}<input dir="auto" minLength={2} maxLength={80} value={mot} onChange={(e) => setMot(e.currentTarget.value)} required /></label>
                  <button type="submit" disabled={occupe}>{t("ajouterMot")}</button>
                </form>
                {donnees.mots.length === 0 ? <p className={styles.vide}>{t("aucunMot")}</p> : (
                  <ul className={styles.tableau}>
                    {donnees.mots.map((m) => (
                      <li key={m}><bdi dir="auto">{m}</bdi>
                        <button type="button" className={styles.lien} disabled={occupe} onClick={() => void agir({ action: "retirerMot", mot: m })}>{t("retirer")}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
    </div>
  );
}
