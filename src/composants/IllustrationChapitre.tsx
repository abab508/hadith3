// Illustrations des chapitres, dessinées en SVG (aucune image externe) : scène de nuit et or, motifs NON figuratifs
// (aucun être vivant représenté). Le motif principal suit le sujet du chapitre ; la graine varie étoiles et dunes.
import type { ReactElement } from "react";
import styles from "@/composants/IllustrationChapitre.module.css";

export type Motif =
  | "livre" | "croissant" | "mosquee" | "lanterne" | "kaaba" | "eau" | "palmier" | "balance" | "plume" | "chapelet"
  | "pieces" | "maison" | "sablier" | "etoiles" | "feuille" | "coupe" | "etendard" | "porte" | "montagne" | "soleil"
  | "nuage" | "bol" | "tente" | "chemin";

const t = (x: number, y: number, s = 1) => `translate(${x} ${y}) scale(${s})`;

// Chaque motif tient dans un carré de 100 × 100 centré en (0, 0).
const motifs: Record<Motif, (or: string) => ReactElement> = {
  livre: (or) => <g><path d="M-44 -20 L0 -10 L44 -20 L44 30 L0 40 L-44 30 Z" fill="#0f1b31" stroke={or} strokeWidth="3" /><path d="M0 -10 V40" stroke={or} strokeWidth="3" /><path d="M-36 -6 L-8 0M-36 4 L-8 10M-36 14 L-8 20M8 0 L36 -6M8 10 L36 4M8 20 L36 14" stroke="#e8b35c88" strokeWidth="2" /><path d="M-10 -34 l10 -10 l10 10 l-10 10 z" fill={or} /></g>,
  croissant: (or) => <g><path d="M10 -40 A40 40 0 1 0 10 40 A32 32 0 1 1 10 -40 Z" fill={or} /><path d="M30 -14 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#fff3cf" /></g>,
  mosquee: (or) => <g fill="#0f1b31" stroke={or} strokeWidth="3"><path d="M-30 40 V0 A30 30 0 0 1 30 0 V40 Z" /><path d="M0 -30 V-44" /><circle cx="0" cy="-47" r="3" fill={or} /><path d="M-46 40 V-20 h8 V40M38 40 V-20 h8 V40" /><path d="M-42 -20 l0 -12M42 -20 l0 -12" /><path d="M-10 40 V18 A10 10 0 0 1 10 18 V40" fill="#e8b35c33" /></g>,
  lanterne: (or) => <g><path d="M0 -46 V-34" stroke={or} strokeWidth="3" /><path d="M-14 -34 H14 L10 -26 H-10 Z" fill={or} /><path d="M-12 -26 H12 L18 10 L10 34 H-10 L-18 10 Z" fill="#0f1b31" stroke={or} strokeWidth="3" /><ellipse className={styles.flamme} cx="0" cy="6" rx="7" ry="12" fill="#ffd37a" /><path d="M-8 34 H8 L0 46 Z" fill={or} /></g>,
  kaaba: (or) => <g><path d="M-36 -20 L0 -34 L36 -20 V30 L0 44 L-36 30 Z" fill="#05070d" stroke={or} strokeWidth="2" /><path d="M-36 -8 L0 -22 L36 -8" stroke={or} strokeWidth="5" fill="none" /><path d="M0 -22 V44" stroke="#e8b35c55" strokeWidth="1.5" /><path d="M14 4 h10 v22 h-10 z" fill={or} /></g>,
  eau: (or) => <g fill={or}><path d="M0 -44 C14 -22 22 -8 22 6 A22 22 0 0 1 -22 6 C-22 -8 -14 -22 0 -44 Z" /><path d="M-34 30 C-24 22 -14 38 -4 30 S16 22 26 30 S40 38 46 30" stroke={or} strokeWidth="3" fill="none" /><path d="M-8 -2 A10 10 0 0 0 0 14" stroke="#fff3cf" strokeWidth="3" fill="none" /></g>,
  palmier: (or) => <g stroke={or} strokeWidth="3" fill="none"><path d="M4 44 C2 20 0 0 -2 -20" strokeWidth="5" /><path d="M-2 -20 C-20 -34 -38 -30 -46 -20M-2 -20 C-16 -10 -30 -2 -34 10M-2 -20 C14 -36 32 -34 42 -26M-2 -20 C14 -8 28 0 32 12M-2 -20 C-4 -36 0 -44 6 -48" /><circle cx="-4" cy="-14" r="3" fill={or} /><circle cx="3" cy="-12" r="3" fill={or} /></g>,
  balance: (or) => <g stroke={or} strokeWidth="3" fill="none"><path d="M0 -40 V40M-26 44 H26M-40 -26 H40" /><path d="M-40 -26 L-52 6 H-28 Z M40 -26 L28 6 H52 Z" fill="#e8b35c33" /><circle cx="0" cy="-44" r="4" fill={or} /></g>,
  plume: (or) => <g><path d="M34 -44 C0 -36 -20 -6 -26 30 L-18 34 C-6 4 12 -20 34 -44 Z" fill={or} /><path d="M-26 30 L-34 44" stroke={or} strokeWidth="3" /><path d="M-6 36 h40 v10 h-40 z" fill="#0f1b31" stroke={or} strokeWidth="2" /></g>,
  chapelet: (or) => <g fill={or}>{Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * 30} cy={Math.sin(a) * 24 - 6} r="4.5" />; })}<path d="M0 18 V36" stroke={or} strokeWidth="3" /><path d="M-6 36 h12 l-6 12 z" /></g>,
  pieces: (or) => <g>{[[-22, 18], [10, 22], [-6, -4], [24, -8], [-30, -22]].map(([x, y], i) => <g key={i} transform={t(x!, y!)}><circle r="15" fill="#0f1b31" stroke={or} strokeWidth="3" /><circle r="9" fill="none" stroke="#e8b35c88" strokeWidth="2" /></g>)}</g>,
  maison: (or) => <g fill="#0f1b31" stroke={or} strokeWidth="3"><path d="M-40 40 V-4 L0 -36 L40 -4 V40 Z" /><path d="M-10 40 V14 h20 V40" fill="#e8b35c55" /><rect x="-30" y="2" width="12" height="12" fill="#ffd37a66" /><rect x="18" y="2" width="12" height="12" fill="#ffd37a66" /></g>,
  sablier: (or) => <g stroke={or} strokeWidth="3"><path d="M-28 -44 H28M-28 44 H28" /><path d="M-22 -44 C-22 -10 22 -10 22 -44Z M-22 44 C-22 10 22 10 22 44Z" fill="#0f1b31" /><path d="M-14 38 C-6 26 6 26 14 38 Z" fill={or} stroke="none" /><path d="M0 -6 V20" stroke="#ffd37a" className={styles.sable} /></g>,
  etoiles: (or) => <g fill={or}>{[[0, 0, 12], [-30, -24, 6], [28, -30, 7], [-34, 26, 5], [32, 22, 8], [6, -40, 4]].map(([x, y, r], i) => <path key={i} transform={t(x!, y!, r! / 10)} d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" className={styles.scintille} style={{ ["--d" as string]: `${i * 0.4}s` }} />)}</g>,
  feuille: (or) => <g><path d="M-30 36 C-40 -6 -6 -40 36 -40 C36 4 6 38 -30 36 Z" fill={or} /><path d="M-30 36 C-8 12 10 -10 30 -34" stroke="#0a1324" strokeWidth="3" fill="none" /><path d="M-14 10 l14 -2M-4 -4 l14 -2M-18 22 l8 -10" stroke="#0a1324" strokeWidth="2" /></g>,
  coupe: (or) => <g fill="#0f1b31" stroke={or} strokeWidth="3"><path d="M-30 -30 H30 C30 4 14 16 0 16 C-14 16 -30 4 -30 -30 Z" /><path d="M0 16 V34M-18 40 H18" /><path d="M-22 -22 H22" stroke="#ffd37a88" /><path d="M10 -44 c6 6 -6 8 0 14" fill="none" stroke="#ffd37a88" /></g>,
  etendard: (or) => <g><path d="M-30 46 V-46" stroke={or} strokeWidth="4" /><path d="M-28 -42 C0 -30 10 -50 40 -38 V0 C10 -12 0 8 -28 -4 Z" fill={or} /><path d="M2 -26 a8 8 0 1 0 4 14 a6 6 0 1 1 -4 -14" fill="#0a1324" /></g>,
  porte: (or) => <g fill="#0f1b31" stroke={or} strokeWidth="3"><path d="M-30 44 V-6 C-30 -30 -14 -44 0 -48 C14 -44 30 -30 30 -6 V44 Z" /><path d="M-18 44 V-4 C-18 -18 -8 -28 0 -32 C8 -28 18 -18 18 -4 V44" fill="#ffd37a44" /><path d="M0 -32 V44" /></g>,
  montagne: (or) => <g><path d="M-50 40 L-14 -30 L4 0 L20 -20 L50 40 Z" fill="#0f1b31" stroke={or} strokeWidth="3" /><path d="M-14 -30 L-6 -14 L-20 -12 Z" fill={or} /><circle cx="30" cy="-36" r="6" fill="#fff3cf" /></g>,
  soleil: (or) => <g><circle r="20" fill={or} />{Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M${Math.cos(a) * 26} ${Math.sin(a) * 26} L${Math.cos(a) * 38} ${Math.sin(a) * 38}`} stroke={or} strokeWidth="3" />; })}<path d="M-50 30 H50" stroke="#e8b35c88" strokeWidth="2" /></g>,
  nuage: (or) => <g><path d="M-36 10 A16 16 0 0 1 -20 -16 A22 22 0 0 1 20 -18 A16 16 0 0 1 36 10 Z" fill="#16264a" stroke={or} strokeWidth="3" />{[-20, 0, 20].map((x, i) => <path key={i} d={`M${x} 18 l-4 14`} stroke="#ffd37a" strokeWidth="3" className={styles.pluie} style={{ ["--d" as string]: `${i * 0.3}s` }} />)}</g>,
  bol: (or) => <g><path d="M-40 0 H40 C40 28 20 40 0 40 C-20 40 -40 28 -40 0 Z" fill="#0f1b31" stroke={or} strokeWidth="3" />{[[-18, -6], [0, -10], [18, -6], [-8, -18], [10, -18]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="8" ry="5" fill={or} />)}</g>,
  tente: (or) => <g><path d="M-48 40 L0 -36 L48 40 Z" fill="#0f1b31" stroke={or} strokeWidth="3" /><path d="M0 -36 L-10 40 M0 -36 L10 40" stroke="#e8b35c88" strokeWidth="2" /><path d="M-10 40 L0 10 L10 40 Z" fill="#ffd37a55" /></g>,
  chemin: (or) => <g><path d="M-10 44 C-30 20 30 10 4 -10 C-14 -24 10 -36 2 -48" stroke={or} strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M-10 44 C-30 20 30 10 4 -10 C-14 -24 10 -36 2 -48" stroke="#0a1324" strokeWidth="2" fill="none" strokeDasharray="4 6" /></g>,
};

// Générateur pseudo-aléatoire déterministe (même chapitre → même dessin, rendu serveur stable).
function aleatoire(graine: string) {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

// instance : suffixe d'identifiant quand la même illustration apparaît plusieurs fois sur la page.
export default function IllustrationChapitre({ motif, second, graine, titre, className, instance = "" }: {
  motif: Motif; second?: Motif; graine: string; titre?: string; className?: string; instance?: string;
}) {
  const r = aleatoire(graine);
  const id = `ill-${graine.replace(/[^a-z0-9-]/gi, "")}${instance ? `-${instance}` : ""}`;
  const etoiles = Array.from({ length: 34 }, () => ({ x: r() * 320, y: r() * 110, s: 0.4 + r() * 1.4, d: r() * 4 }));
  const dune = (y: number, a: number) => `M0 ${y} C60 ${y - a * r()} 110 ${y + a} 170 ${y - a * 0.5} S270 ${y - a} 320 ${y} V180 H0 Z`;
  const teinte = Math.floor(r() * 3);
  const fonds = [["#0a1324", "#1b2f5a"], ["#0b1020", "#2a2148"], ["#08131c", "#123a4a"]][teinte]!;
  return (
    <svg className={`${styles.illustration} ${className ?? ""}`} viewBox="0 0 320 180" role={titre ? "img" : undefined} aria-label={titre} aria-hidden={titre ? undefined : true} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-ciel`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={fonds[0]} /><stop offset="1" stopColor={fonds[1]} /></linearGradient>
        <linearGradient id={`${id}-or`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff0bd" /><stop offset=".5" stopColor="#e8b35c" /><stop offset="1" stopColor="#b8792e" /></linearGradient>
        <radialGradient id={`${id}-halo`}><stop offset="0" stopColor="#ffd37a" stopOpacity=".45" /><stop offset="1" stopColor="#ffd37a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-ciel)`} />
      {etoiles.map((e, i) => <circle key={i} cx={e.x} cy={e.y} r={e.s} fill="#fff3cf" className={styles.scintille} style={{ ["--d" as string]: `${e.d}s` }} />)}
      <circle cx="160" cy="88" r="70" fill={`url(#${id}-halo)`} />
      <path d={dune(150, 18)} fill="#0e1a30" />
      <path d={dune(162, 12)} fill="#0a1324" stroke="#e8b35c33" />
      <g transform={t(160, 92, 0.95)} className={styles.motif}>{motifs[motif](`url(#${id}-or)`)}</g>
      {second && <g transform={t(r() > 0.5 ? 62 : 258, 118, 0.42)} opacity=".85" className={styles.motifSecond}>{motifs[second](`url(#${id}-or)`)}</g>}
      <rect x="4" y="4" width="312" height="172" rx="8" fill="none" stroke="#e3b86655" />
    </svg>
  );
}
