"use client";

// Formulaires du forum et du compte : ils appellent les routes /api/compte et /api/forum, puis rafraîchissent la page.
import { useState, type FormEvent } from "react";
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

const Alerte = ({ message }: { message: { texte: string; erreur?: boolean } | null }) =>
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
  const action = async (corps: Record<string, string>, reussite?: string) => {
    setOccupe(true); setMessage(null);
    const r = await envoyer("/api/compte", corps).catch((): Reponse => ({ ok: false, status: 0, corps: {} }));
    setOccupe(false);
    if (!r.ok) return erreur(r);
    if (reussite) setMessage({ texte: reussite });
    setChamps({ email: "", motDePasse: "", code: "", nom: "", ancien: "", nouveau: "" });
    router.refresh();
  };

  if (membre) {
    return (
      <div className={styles.colonne}>
        <p className={styles.carte}>{t("connecte", { nom: membre.nom })}</p>
        <form className={styles.carte} onSubmit={(e) => { e.preventDefault(); void action({ action: "motDePasse", ancien: champs.ancien, nouveau: champs.nouveau }, t("mdpChange")); }}>
          <h2 className={styles.sousTitre}>{t("changerMdp")}</h2>
          <label>{t("ancien")}<input type="password" autoComplete="current-password" value={champs.ancien} onChange={maj("ancien")} required /></label>
          <label>{t("nouveau")}<input type="password" autoComplete="new-password" minLength={10} value={champs.nouveau} onChange={maj("nouveau")} required /></label>
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
          <label>{t("motDePasse")}<input type="password" autoComplete="current-password" value={champs.motDePasse} onChange={maj("motDePasse")} required /></label>
          <button type="submit" disabled={occupe}>{t("seConnecter")}</button>
        </form>
      ) : (
        <form className={styles.carte} onSubmit={(e) => { e.preventDefault(); void action({ action: "inscription", code: champs.code, email: champs.email, nom: champs.nom, motDePasse: champs.motDePasse }); }}>
          <p className={styles.note}>{t("aideCode")}</p>
          <label>{t("code")}<input value={champs.code} onChange={maj("code")} placeholder="ABCD-EFGH-JKLM" autoComplete="off" required /></label>
          <label>{t("email")}<input type="email" autoComplete="email" value={champs.email} onChange={maj("email")} required /></label>
          <label>{t("nom")}<input dir="auto" value={champs.nom} minLength={3} maxLength={30} onChange={maj("nom")} required /><span className={styles.note}>{t("aideNom")}</span></label>
          <label>{t("motDePasse")}<input type="password" autoComplete="new-password" minLength={10} value={champs.motDePasse} onChange={maj("motDePasse")} required /><span className={styles.note}>{t("aideMdp")}</span></label>
          <button type="submit" disabled={occupe}>{t("creer")}</button>
        </form>
      )}
      <Alerte message={message} />
      <p className={styles.note}>{t("viePrivee")}</p>
    </div>
  );
}
