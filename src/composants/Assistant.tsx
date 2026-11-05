"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import styles from "@/composants/Assistant.module.css";

type Message = { role: "user" | "assistant"; content: string };
const CLE = "milaghaiba-assistant";
const VOIX: Record<string, string> = { ar: "ar-SA", fr: "fr-FR", en: "en-US", es: "es-ES", ur: "ur-PK", id: "id-ID", ms: "ms-MY", tr: "tr-TR" };
const ARABE = /[؀-ۿ]/u;

// Reconnaissance vocale du navigateur (types absents de la bibliothèque DOM standard).
type Reconnaissance = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null };
const classeReconnaissance = (): (new () => Reconnaissance) | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => Reconnaissance; webkitSpeechRecognition?: new () => Reconnaissance };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

// Texte de l'assistant : paragraphes, **gras** et liens internes du site seulement ([titre](/fr/...)).
function Riche({ texte }: { texte: string }) {
  return (
    <>
      {texte.split(/\n+/).filter((l) => l.trim()).map((ligne, i) => {
        const morceaux = ligne.split(/(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*)/g).filter(Boolean);
        return (
          <p key={i} dir="auto" className={ARABE.test(ligne) ? "texte-arabe" : undefined}>
            {morceaux.map((m, j) => {
              const lien = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(m);
              if (lien) return lien[2]!.startsWith("/") && !lien[2]!.startsWith("//") ? <a key={j} href={lien[2]}>{lien[1]}</a> : <span key={j}>{lien[1]}</span>;
              const gras = /^\*\*([^*]+)\*\*$/.exec(m);
              return gras ? <strong key={j}>{gras[1]}</strong> : <span key={j}>{m.replace(/^\s*[-*>]\s+/, "")}</span>;
            })}
          </p>
        );
      })}
    </>
  );
}

// Texte lisible à voix haute : sans balises Markdown ni liens, découpé en passages arabes / non arabes.
function passages(texte: string): { texte: string; arabe: boolean }[] {
  const propre = texte.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_#>`]/g, "");
  const sortie: { texte: string; arabe: boolean }[] = [];
  for (const m of propre.matchAll(/([؀-ۿ][؀-ۿ\sً-ٰٟ«»،؛؟.:!]*)|([^؀-ۿ]+)/gu)) {
    const t = m[0].trim();
    if (t) sortie.push({ texte: t, arabe: Boolean(m[1]) });
  }
  return sortie;
}

export default function Assistant() {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [etat, setEtat] = useState<string | null>(null);
  const [ecoute, setEcoute] = useState(false);
  const [lecture, setLecture] = useState<number | null>(null);
  const [microDispo, setMicroDispo] = useState(false);
  const [voixDispo, setVoixDispo] = useState(false);
  const [rendreFocus, setRendreFocus] = useState(false);
  const bulle = useRef<HTMLButtonElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);
  const fil = useRef<HTMLOListElement>(null);
  const reco = useRef<Reconnaissance | null>(null);

  useEffect(() => {
    setMicroDispo(Boolean(classeReconnaissance()));
    setVoixDispo(typeof window !== "undefined" && "speechSynthesis" in window);
    try { const s = sessionStorage.getItem(CLE); if (s) setMessages(JSON.parse(s) as Message[]); } catch { /* historique illisible : on repart de zéro */ }
  }, []);
  useEffect(() => { try { sessionStorage.setItem(CLE, JSON.stringify(messages.slice(-30))); } catch { /* stockage plein ou interdit */ } }, [messages]);
  useEffect(() => { fil.current?.lastElementChild?.scrollIntoView({ block: "end" }); }, [messages, etat]);
  useEffect(() => { if (ouvert) champ.current?.focus(); }, [ouvert]);
  // La bulle réapparaît à la fermeture : le focus lui revient une fois qu'elle est affichée.
  useEffect(() => { if (!ouvert && rendreFocus) { bulle.current?.focus(); setRendreFocus(false); } }, [ouvert, rendreFocus]);

  const fermer = useCallback(() => {
    setOuvert(false);
    reco.current?.stop();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setLecture(null);
    setRendreFocus(true);
  }, []);

  const envoyer = useCallback(async (texte: string) => {
    const question = texte.trim().slice(0, 1500);
    if (!question || enCours) return;
    const historique: Message[] = [...messages, { role: "user", content: question }];
    setMessages([...historique, { role: "assistant", content: "" }]);
    setSaisie("");
    setEnCours(true);
    setEtat(t("reflexion"));
    let reponse = "";
    const ecrire = (contenu: string) => setMessages([...historique, { role: "assistant", content: contenu }]);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, messages: historique.filter((m) => m.content).slice(-10) }),
      });
      if (!r.body) throw new Error("flux absent");
      const lecteur = r.body.getReader();
      const decodeur = new TextDecoder();
      let reste = "";
      for (;;) {
        const { value, done } = await lecteur.read();
        if (done) break;
        reste += decodeur.decode(value, { stream: true });
        const lignes = reste.split("\n");
        reste = lignes.pop() ?? "";
        for (const l of lignes) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l) as { t: string; d?: string; nom?: string; code?: string };
          if (ev.t === "texte" && ev.d) { reponse += ev.d; ecrire(reponse); setEtat(null); }
          else if (ev.t === "outil") setEtat(t("recherche"));
          else if (ev.t === "erreur") { reponse += `${reponse ? "\n\n" : ""}${t(`erreurs.${["trop", "occupe", "refus", "invalide"].includes(ev.code ?? "") ? ev.code : "indisponible"}`)}`; ecrire(reponse); }
        }
      }
      if (!reponse.trim()) ecrire(t("erreurs.indisponible"));
    } catch {
      ecrire(reponse.trim() ? reponse : t("erreurs.indisponible"));
    } finally {
      setEnCours(false);
      setEtat(null);
    }
  }, [enCours, locale, messages, t]);

  const micro = () => {
    const Classe = classeReconnaissance();
    if (!Classe) return;
    if (ecoute) { reco.current?.stop(); return; }
    const r = new Classe();
    r.lang = VOIX[locale] ?? "fr-FR";
    r.interimResults = true;
    r.continuous = false;
    let final = "";
    r.onresult = (e) => {
      const texte = Array.from(e.results).map((x) => x[0]!.transcript).join(" ");
      setSaisie(texte);
      if (Array.from(e.results).every((x) => x.isFinal)) final = texte;
    };
    r.onerror = () => setEcoute(false);
    r.onend = () => { setEcoute(false); if (final.trim()) void envoyer(final); };
    reco.current = r;
    setEcoute(true);
    r.start(); // le navigateur demande l'autorisation du micro à ce premier clic
  };

  const ecouter = (i: number, texte: string) => {
    const synthese = window.speechSynthesis;
    synthese.cancel();
    if (lecture === i) { setLecture(null); return; }
    const voix = synthese.getVoices();
    const voixArabe = voix.find((v) => v.lang.toLowerCase().startsWith("ar"));
    const morceaux = passages(texte);
    morceaux.forEach((p, k) => {
      const u = new SpeechSynthesisUtterance(p.texte);
      u.lang = p.arabe ? "ar-SA" : VOIX[locale] ?? "fr-FR";
      if (p.arabe && voixArabe) u.voice = voixArabe;
      if (k === morceaux.length - 1) u.onend = () => setLecture(null);
      synthese.speak(u);
    });
    setLecture(i);
  };

  return (
    <div className={styles.assistant}>
      {!ouvert && (
        <button ref={bulle} type="button" className={styles.bulle} onClick={() => setOuvert(true)} aria-haspopup="dialog" aria-label={t("ouvrir")} title={t("ouvrir")} data-assistant="bulle">
          <svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="9" y="9" width="22" height="22" rx="2" />
            <rect x="9" y="9" width="22" height="22" rx="2" transform="rotate(45 20 20)" />
            <path d="M15 19h10M15 23h6" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {ouvert && (
        <section role="dialog" aria-modal="false" aria-labelledby="assistant-titre" className={styles.fenetre} data-assistant="fenetre"
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); fermer(); } }}>
          <header className={styles.entete}>
            <h2 id="assistant-titre" className={styles.titre}>{t("titre")}</h2>
            {messages.length > 0 && <button type="button" className={styles.lien} onClick={() => { setMessages([]); window.speechSynthesis?.cancel(); }}>{t("effacer")}</button>}
            <button type="button" className={styles.fermer} onClick={fermer} aria-label={t("fermer")} title={t("fermer")}>×</button>
          </header>
          <p className={styles.rappel}>{t("rappel")}</p>
          <ol ref={fil} className={styles.fil} aria-live="polite">
            {messages.length === 0 && <li className={styles.assistantMsg}><p>{t("accueil")}</p></li>}
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? styles.utilisateurMsg : styles.assistantMsg} data-role={m.role}>
                <span className="visuellement-cache">{m.role === "user" ? t("vous") : t("nom")} : </span>
                {m.role === "user" ? <p dir="auto">{m.content}</p> : <Riche texte={m.content} />}
                {m.role === "assistant" && m.content && voixDispo && !(enCours && i === messages.length - 1) && (
                  <button type="button" className={styles.lien} onClick={() => ecouter(i, m.content)} aria-pressed={lecture === i}>
                    {lecture === i ? `■ ${t("arreter")}` : `▶ ${t("ecouter")}`}
                  </button>
                )}
              </li>
            ))}
            {etat && <li className={styles.etat} role="status">{etat}</li>}
          </ol>
          <form className={styles.saisie} onSubmit={(e) => { e.preventDefault(); void envoyer(saisie); }}>
            <label htmlFor="assistant-question" className="visuellement-cache">{t("placeholder")}</label>
            <textarea id="assistant-question" ref={champ} rows={2} dir="auto" value={saisie} maxLength={1500} placeholder={t("placeholder")}
              onChange={(e) => setSaisie(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void envoyer(saisie); } }} />
            {microDispo && (
              <button type="button" className={`${styles.icone} ${ecoute ? styles.ecoute : ""}`} onClick={micro} aria-pressed={ecoute} aria-label={ecoute ? t("microEcoute") : t("micro")} title={ecoute ? t("microEcoute") : t("micro")}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
            )}
            <button type="submit" className={styles.envoyer} disabled={enCours || !saisie.trim()}>{t("envoyer")}</button>
          </form>
          {!microDispo && <p className={styles.note}>{t("microAbsent")}</p>}
        </section>
      )}
    </div>
  );
}
