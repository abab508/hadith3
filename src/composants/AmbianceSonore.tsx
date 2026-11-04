"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "@/composants/AmbianceSonore.module.css";

// Ambiance sonore créée en direct (Web Audio), aucun fichier téléchargé :
// vent du soir, nappe grave, crépitement de lanterne, carillons doux.
// Coupée par défaut : elle ne démarre qu'après un clic (règle des navigateurs).

const CLE = "milaghaiba.ambiance.v1";
// Notes d'un mode oriental (ré, mi bémol, fa dièse, sol, la, si bémol, ré).
const NOTES = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 587.33];

type Moteur = { ctx: AudioContext; maitre: GainNode; arret: () => void };

function demarrer(): Moteur {
  const ctx = new AudioContext();
  const maitre = ctx.createGain();
  maitre.gain.value = 0;
  maitre.connect(ctx.destination);

  // Écho léger pour donner de l'espace (salle de pierre).
  const echo = ctx.createDelay(1.5);
  echo.delayTime.value = 0.42;
  const retour = ctx.createGain();
  retour.gain.value = 0.38;
  const filtreEcho = ctx.createBiquadFilter();
  filtreEcho.type = "lowpass";
  filtreEcho.frequency.value = 2400;
  echo.connect(filtreEcho).connect(retour).connect(echo);
  filtreEcho.connect(maitre);

  // Bruit blanc commun au vent et au crépitement.
  const tampon = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const donnees = tampon.getChannelData(0);
  for (let i = 0; i < donnees.length; i++) donnees[i] = Math.random() * 2 - 1;

  // Vent : bruit filtré dont la hauteur et le volume ondulent lentement.
  const vent = ctx.createBufferSource();
  vent.buffer = tampon;
  vent.loop = true;
  const filtreVent = ctx.createBiquadFilter();
  filtreVent.type = "bandpass";
  filtreVent.frequency.value = 520;
  filtreVent.Q.value = 0.7;
  const volumeVent = ctx.createGain();
  volumeVent.gain.value = 0.05;
  const lfoVent = ctx.createOscillator();
  lfoVent.frequency.value = 0.07;
  const ampLfoVent = ctx.createGain();
  ampLfoVent.gain.value = 260;
  lfoVent.connect(ampLfoVent).connect(filtreVent.frequency);
  const lfoSouffle = ctx.createOscillator();
  lfoSouffle.frequency.value = 0.11;
  const ampSouffle = ctx.createGain();
  ampSouffle.gain.value = 0.03;
  lfoSouffle.connect(ampSouffle).connect(volumeVent.gain);
  vent.connect(filtreVent).connect(volumeVent).connect(maitre);

  // Nappe grave : ré et la légèrement désaccordés, très filtrés.
  const filtreNappe = ctx.createBiquadFilter();
  filtreNappe.type = "lowpass";
  filtreNappe.frequency.value = 520;
  const volumeNappe = ctx.createGain();
  volumeNappe.gain.value = 0.045;
  filtreNappe.connect(volumeNappe).connect(maitre);
  const oscillateurs = [73.42, 73.9, 110.0, 146.83].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 ? "triangle" : "sine";
    o.frequency.value = f;
    o.connect(filtreNappe);
    return o;
  });
  const lfoNappe = ctx.createOscillator();
  lfoNappe.frequency.value = 0.05;
  const ampNappe = ctx.createGain();
  ampNappe.gain.value = 0.02;
  lfoNappe.connect(ampNappe).connect(volumeNappe.gain);

  [vent, lfoVent, lfoSouffle, lfoNappe, ...oscillateurs].forEach((s) => s.start());

  // Crépitement de la lanterne : petits éclats de bruit au hasard.
  const crepiter = () => {
    const t = ctx.currentTime;
    const eclat = ctx.createBufferSource();
    eclat.buffer = tampon;
    const filtre = ctx.createBiquadFilter();
    filtre.type = "highpass";
    filtre.frequency.value = 1800 + Math.random() * 2500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.02 + Math.random() * 0.03, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
    eclat.connect(filtre).connect(g).connect(maitre);
    eclat.start(t, Math.random(), 0.1);
  };

  // Carillon doux : une note du mode, longue résonance, envoyée dans l'écho.
  const carillon = () => {
    const t = ctx.currentTime;
    const f = NOTES[Math.floor(Math.random() * NOTES.length)] ?? 440;
    [1, 2.76].forEach((harmonique, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * harmonique;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(i ? 0.008 : 0.03, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
      o.connect(g);
      g.connect(maitre);
      g.connect(echo);
      o.start(t);
      o.stop(t + 4.6);
    });
  };

  let minuteurCrepitement = 0;
  const boucleCrepitement = () => {
    if (Math.random() < 0.7) crepiter();
    minuteurCrepitement = window.setTimeout(boucleCrepitement, 90 + Math.random() * 420);
  };
  boucleCrepitement();
  let minuteurCarillon = 0;
  const boucleCarillon = () => {
    carillon();
    minuteurCarillon = window.setTimeout(boucleCarillon, 5000 + Math.random() * 7000);
  };
  minuteurCarillon = window.setTimeout(boucleCarillon, 1800);

  maitre.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2.5);

  return {
    ctx,
    maitre,
    arret: () => {
      window.clearTimeout(minuteurCrepitement);
      window.clearTimeout(minuteurCarillon);
      maitre.gain.cancelScheduledValues(ctx.currentTime);
      maitre.gain.setValueAtTime(maitre.gain.value, ctx.currentTime);
      maitre.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      window.setTimeout(() => void ctx.close(), 1400);
    },
  };
}

export default function AmbianceSonore() {
  const t = useTranslations("entete");
  const [actif, setActif] = useState(false);
  const moteur = useRef<Moteur | null>(null);

  useEffect(() => () => moteur.current?.arret(), []);

  function basculer() {
    if (actif) {
      moteur.current?.arret();
      moteur.current = null;
      setActif(false);
      try { window.localStorage.setItem(CLE, "off"); } catch { /* réglage local facultatif */ }
      return;
    }
    try {
      moteur.current = demarrer();
      setActif(true);
      window.localStorage.setItem(CLE, "on");
    } catch {
      setActif(false);
    }
  }

  const libelle = actif ? t("ambianceCouper") : t("ambianceActiver");
  return (
    <button type="button" className={styles.bouton} data-actif={actif} aria-pressed={actif} aria-label={libelle} title={libelle} onClick={basculer}>
      <span className={styles.ondes} aria-hidden="true">
        <span /><span /><span /><span />
      </span>
    </button>
  );
}
