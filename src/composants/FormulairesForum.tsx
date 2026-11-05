"use client";

// Formulaires du forum et du compte : ils appellent les routes /api/compte et /api/forum, puis rafraîchissent la page.
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import styles from "@/app/[locale]/forum/Forum.module.css";
import { cleErreurCompte, cleErreurForum } from "@/donnees/cles-interface";

type Reponse = { ok: boolean; status: number; corps: Record<string, unknown> };
async function envoyer(url: string, corps: unknown): Promise<Reponse> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(corps) });
  return { ok: r.ok, status: r.status, corps: await r.json().catch(() => ({})) };
}

function useEnvoi(espace: "forum" | "compte") {
  const t = useTranslations(espace);
  // Code renvoyé par la route -> clé de traduction complète (table explicite, jamais de clé construite).
  const cle = espace === "forum" ? cleErreurForum : cleErreurCompte;
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const erreur = (r: Reponse) => setMessage({ texte: t(cle(String(r.corps.erreur ?? "serveur")), { status: r.status }), erreur: true });
  return { t, message, setMessage, occupe, setOccupe, erreur };
}

// Champ mot de passe avec un petit bouton œil pour afficher ou masquer les caractères.
function ChampMotDePasse({ libelle, valeur, onChange, autoComplete, minLength, aide }: {
  libelle: string; valeur: string; onChange: (e: { currentTarget: { value: string } }) => void;
  autoComplete: string; minLength?: number; aide?: string;
}) {
  const t = useTranslations("compte");
  const [visible, setVisible] = useState(false);
  return (
    <label>{libelle}
      <span className={styles.champMdp}>
        <input type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} value={valeur} onChange={onChange} required
          autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        <button type="button" className={styles.oeil} aria-pressed={visible} aria-label={t(visible ? "masquerCaracteres" : "afficherCaracteres")}
          title={t(visible ? "masquerCaracteres" : "afficherCaracteres")} onClick={() => setVisible(!visible)}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
            {visible ? <path d="M4 4l16 16" /> : null}
          </svg>
        </button>
      </span>
      {aide ? <span className={styles.note}>{aide}</span> : null}
    </label>
  );
}

const CLE_EMAIL_RETENU = "milaghaiba_email";
const lireEmailRetenu = () => { try { return localStorage.getItem(CLE_EMAIL_RETENU) ?? ""; } catch { return ""; } };

const Alerte =({ message }: { message: { texte: string; erreur?: boolean } | null }) =>
  message ? <p role={message.erreur ? "alert" : "status"} className={message.erreur ? styles.erreur : styles.succes}>{message.texte}</p> : null;

export function FormulaireSujet() {
  const { t, message, setMessage, occupe, setOccupe, erreur } = useEnvoi("forum");
  const router = useRouter();
  const [titre, setTitre] = useState(""), [corps, setCorps] = useState("");
  const soumettre = async (e: FormEvent) => {
    e.preventDefault(); setOccupe(true); setMessage(null);
    const r = await envoyer("/api/forum/sujets", { titre, corps }).catch((): Reponse => ({ ok: false, status: 0, corps: {} }));
    setOccupe(false);
    if (!r.ok) return erreur(r);
    if (r.corps.statut === "retenu") { setMessage({ texte: t("retenu") }); setTitre(""); setCorps(""); return; }
    router.push(`/forum/${r.corps.id}`);
  };
  return (
    <form className={styles.carte} onSubmit={soumettre}>
      <label>{t("champTitre")}<input dir="auto" value={titre} minLength={5} maxLength={150} required onChange={(e) => setTitre(e.currentTarget.value)} /></label>
      <label>{t("champTexte")}<textarea dir="auto" rows={8} value={corps} minLength={2} maxLength={5000} required onChange={(e) => setCorps(e.currentTarget.value)} /></label>
      <Alerte message={message} />
      <button type="submit" disabled={occupe}>{t("publier")}</button>
    </form>
  );
}

export function FormulaireReponse({ sujetId }: { sujetId: number }) {
  const { t, message, setMessage, occupe, setOccupe, erreur } = useEnvoi("forum");
  const router = useRouter();
  const [corps, setCorps] = useState("");
  const soumettre = async (e: FormEvent) => {
    e.preventDefault(); setOccupe(true); setMessage(null);
    const r = await envoyer(`/api/forum/sujets/${sujetId}/messages`, { corps }).catch((): Reponse => ({ ok: false, status: 0, corps: {} }));
    setOccupe(false);
    if (!r.ok) return erreur(r);
    setCorps("");
    setMessage({ texte: r.corps.statut === "retenu" ? t("retenu") : t("envoye") });
    router.refresh();
  };
  return (
    <form className={styles.carte} onSubmit={soumettre}>
      <label>{t("votreReponse")}<textarea dir="auto" rows={5} value={corps} minLength={2} maxLength={5000} required onChange={(e) => setCorps(e.currentTarget.value)} /></label>
      <Alerte message={message} />
      <button type="submit" disabled={occupe}>{t("repondre")}</button>
    </form>
  );
}

export function FormulaireCompte({ membre }: { membre: { nom: string } | null }) {
  const { t, message, setMessage, occupe, setOccupe, erreur } = useEnvoi("compte");
  const router = useRouter();
  const [onglet, setOnglet] = useState<"connexion" | "inscription">("connexion");
  const [champs, setChamps] = useState({ email: "", motDePasse: "", code: "", nom: "", ancien: "", nouveau: "" });
  const maj = (k: keyof typeof champs) => (e: { currentTarget: { value: string } }) => setChamps({ ...champs, [k]: e.currentTarget.value });
  // « Se souvenir de mon e-mail » : seulement l'adresse, gardée sur cet appareil (jamais le mot de passe).
  const [souvenir, setSouvenir] = useState(false);
  const [oubli, setOubli] = useState(false);
  useEffect(() => {
    const retenu = lireEmailRetenu();
    if (retenu) { setSouvenir(true); setChamps((c) => ({ ...c, email: retenu })); }
  }, []);
  const retenirEmail = (email: string) => {
    try { if (souvenir) localStorage.setItem(CLE_EMAIL_RETENU, email); else localStorage.removeItem(CLE_EMAIL_RETENU); } catch { /* ignoré */ }
  };
  const action = async (corps: Record<string, string>, reussite?: string) => {
    setOccupe(true); setMessage(null);
    const r = await envoyer("/api/compte", corps).catch((): Reponse => ({ ok: false, status: 0, corps: {} }));
    setOccupe(false);
    if (!r.ok) return erreur(r);
    if (corps.action === "connexion" || corps.action === "inscription") retenirEmail(corps.email ?? "");
    if (reussite) setMessage({ texte: reussite });
    setChamps({ email: lireEmailRetenu(), motDePasse: "", code: "", nom: "", ancien: "", nouveau: "" });
    router.refresh();
  };

  if (membre) {
    return (
      <div className={styles.colonne}>
        <p className={styles.carte}>{t("connecte", { nom: membre.nom })}</p>
        <form className={styles.carte} onSubmit={(e) => { e.preventDefault(); void action({ action: "motDePasse", ancien: champs.ancien, nouveau: champs.nouveau }, t("mdpChange")); }}>
          <h2 className={styles.sousTitre}>{t("changerMdp")}</h2>
          <ChampMotDePasse libelle={t("ancien")} autoComplete="current-password" valeur={champs.ancien} onChange={maj("ancien")} />
          <ChampMotDePasse libelle={t("nouveau")} autoComplete="new-password" minLength={10} valeur={champs.nouveau} onChange={maj("nouveau")} />
          <button type="submit" disabled={occupe}>{t("enregistrer")}</button>
        </form>
        <Alerte message={message} />
        <button type="button" className={styles.secondaire} onClick={() => void action({ action: "deconnexion" })}>{t("deconnexion")}</button>
      </div>
    );
  }
  return (
    <div className={styles.colonne}>
      <div className={styles.onglets} role="tablist">
        {(["connexion", "inscription"] as const).map((o) => (
          <button key={o} type="button" role="tab" aria-selected={onglet === o} onClick={() => { setOnglet(o); setMessage(null); }}>{t(o)}</button>
        ))}
      </div>
      {onglet === "connexion" ? (
        <form className={styles.carte} onSubmit={(e) => { e.preventDefault(); void action({ action: "connexion", email: champs.email, motDePasse: champs.motDePasse }); }}>
          <label>{t("email")}<input type="email" autoComplete="email" value={champs.email} onChange={maj("email")} required /></label>
          <ChampMotDePasse libelle={t("motDePasse")} autoComplete="current-password" valeur={champs.motDePasse} onChange={maj("motDePasse")} />
          <label className={styles.caseACocher}>
            <input type="checkbox" checked={souvenir} onChange={(e) => setSouvenir(e.currentTarget.checked)} />{t("souvenir")}
          </label>
          <button type="submit" disabled={occupe}>{t("seConnecter")}</button>
          <button type="button" className={styles.lien} aria-expanded={oubli} onClick={() => setOubli(!oubli)}>{t("oublie")}</button>
          {oubli ? <p className={styles.note} role="status">{t("aideOubli")}</p> : null}
        </form>
      ) : (
        <form className={styles.carte} onSubmit={(e) => { e.preventDefault(); void action({ action: "inscription", code: champs.code, email: champs.email, nom: champs.nom, motDePasse: champs.motDePasse }); }}>
          <p className={styles.note}>{t("aideCode")}</p>
          <label>{t("code")}<input value={champs.code} onChange={maj("code")} placeholder="ABCD-EFGH-JKLM" autoComplete="off" required /></label>
          <label>{t("email")}<input type="email" autoComplete="email" value={champs.email} onChange={maj("email")} required /></label>
          <label>{t("nom")}<input dir="auto" value={champs.nom} minLength={3} maxLength={30} onChange={maj("nom")} required /><span className={styles.note}>{t("aideNom")}</span></label>
          <ChampMotDePasse libelle={t("motDePasse")} autoComplete="new-password" minLength={10} valeur={champs.motDePasse} onChange={maj("motDePasse")} aide={t("aideMdp")} />
          <label className={styles.caseACocher}>
            <input type="checkbox" checked={souvenir} onChange={(e) => setSouvenir(e.currentTarget.checked)} />{t("souvenir")}
          </label>
          <button type="submit" disabled={occupe}>{t("creer")}</button>
        </form>
      )}
      <Alerte message={message} />
      <p className={styles.note}>{t("viePrivee")}</p>
    </div>
  );
}
