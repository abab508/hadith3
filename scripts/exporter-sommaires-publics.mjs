#!/usr/bin/env node
/**
 * Sommaire des recueils lus depuis les éditions publiques hadith-api (fawazahmed0, Unlicense) :
 * pour chaque recueil, ses « livres » (sections de la source) avec leur titre et leur nombre de hadiths.
 * Aucun texte n'est copié : les hadiths restent chez la source et sont lus à la demande.
 *
 * Usage : node scripts/exporter-sommaires-publics.mjs --info <info.json de hadith-api@1> --sortie data/recueils-publics/sommaires.json
 * (info.json : https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json, téléchargé hors du dépôt)
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// id du catalogue du site -> clé hadith-api
const RECUEILS = {
  "sahih-bukhari": "bukhari", "sahih-muslim": "muslim", "sunan-abi-dawud": "abudawud", "jami-tirmidhi": "tirmidhi",
  "sunan-nasai": "nasai", "sunan-ibn-majah": "ibnmajah", "muwatta": "malik", "al-arbain-an-nawawiyya": "nawawi",
};

const arg = (nom) => { const i = process.argv.indexOf(nom); return i > 0 ? process.argv[i + 1] : undefined; };
const info = arg("--info"), sortie = arg("--sortie");
if (!info || !sortie) { console.error("Usage : --info <info.json> --sortie <fichier>"); process.exit(1); }
const brut = JSON.parse(readFileSync(info, "utf8"));

const recueils = {};
for (const [id, cle] of Object.entries(RECUEILS)) {
  const livre = brut[cle];
  if (!livre) throw new Error(`Recueil absent de la source : ${cle}`);
  const compte = new Map();
  let dernier = 0;
  for (const h of livre.hadiths) {
    const s = h.reference?.book;
    if (!Number.isSafeInteger(s)) continue;
    compte.set(s, (compte.get(s) ?? 0) + 1);
    if (Number.isSafeInteger(h.hadithnumber) && h.hadithnumber > dernier) dernier = h.hadithnumber;
  }
  // [numéro de section, titre de la source (anglais, vide pour la section 0), nombre de hadiths]
  const livres = [...compte.entries()].sort((a, b) => a[0] - b[0])
    .map(([s, n]) => [s, (livre.metadata.sections?.[String(s)] ?? "").trim(), n]);
  recueils[id] = { cle, total: livre.hadiths.length, dernier, livres };
  console.log(`${id}: ${livre.hadiths.length} hadiths, ${livres.length} livres`);
}
mkdirSync(dirname(sortie), { recursive: true });
writeFileSync(sortie, JSON.stringify({ version: 1, source: "fawazahmed0/hadith-api@1", recueils }) + "\n", "utf8");
