import { z } from "zod";

// Schémas des données d'exemple : bibliothèques, transmetteurs, hadiths.
// Les textes arabes sont stockés tels quels (Unicode NFC) et jamais modifiés.

const nfc = z.string().min(1).refine((texte) => texte === texte.normalize("NFC"), "texte non NFC");
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const version = z.string().regex(/^\d+\.\d+\.\d+$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Texte rédigé par langue : l'arabe est toujours présent.
export const texteMultilingue = z.record(z.string(), nfc).refine((t) => "ar" in t, "arabe obligatoire");

export const ouvrage = z.strictObject({
  id,
  categorie: z.enum(["hadith", "rijal"]),
  nom: z.string().min(1),
  nomAr: nfc,
});

export const bibliotheque = z.strictObject({
  id,
  nom: z.string().min(1),
  nomAr: nfc,
  acces: z.enum(["licence-ouverte", "api-accord", "a-valider", "a-verifier"]),
  parDefaut: z.boolean(),
  description: texteMultilingue,
  ouvrages: z.array(ouvrage),
});

export const fichierBibliotheques = z.strictObject({
  version,
  miseAJour: date,
  bibliotheques: z.array(bibliotheque).min(1),
});

// « non-evalue » : transmetteur importé sans jugement ; jamais de catégorie devinée.
export const categorieTransmetteur = z.enum(["source", "compagnon", "thiqa", "saduq", "daif", "compilateur", "non-evalue"]);

export const transmetteur = z.strictObject({
  id,
  nomAr: nfc,
  nomTranslittere: nfc,
  categorie: categorieTransmetteur,
  // null : donnée inconnue de la source, à compléter par un spécialiste.
  deces: z.string().regex(/^~?\d+(-\d+)?$/).nullable(),
  ville: z.strictObject({ ar: nfc, translitteration: nfc }).nullable(),
  generation: z.enum(["source", "compagnon", "tabiiAine", "tabii", "tabiiCadet", "atbaTabiin", "maitreCompilateur", "compilateur"]).nullable(),
  verdictAr: nfc.nullable(),
  jugements: z.array(z.strictObject({
    critiqueAr: nfc,
    critique: nfc,
    verdictAr: nfc,
    reserve: z.boolean(),
    explication: texteMultilingue,
  })),
  biographie: texteMultilingue,
  sources: z.array(z.strictObject({ ouvrage: id, reference: z.string().min(1) })),
});

export const fichierTransmetteurs = z.strictObject({
  version,
  miseAJour: date,
  statut: z.enum(["exemple-a-valider", "valide-specialiste"]),
  transmetteurs: z.array(transmetteur).min(1),
});

export const occurrence = z.strictObject({
  id,
  ouvrage: id,
  numero: z.string().min(1),
  livreAr: nfc,
  livre: nfc,
  correspondance: z.enum(["original", "variante", "reference", "similarite"]),
  bibliotheque: id,
  texteAr: nfc.nullable(),
  voie: id.nullable(),
});

export const hadith = z.strictObject({
  id,
  texteAr: nfc,
  requeteAr: nfc,
  traductions: z.array(z.strictObject({
    langue: z.string().min(2),
    texte: nfc,
    origine: z.enum(["publiee", "validee", "ia", "ia-relue"]),
    source: z.string().min(1).nullable(),
  })),
  statutTerme: z.string().min(1),
  statut: texteMultilingue,
  particularite: texteMultilingue,
  occurrences: z.array(occurrence).min(1),
  chaine: z.strictObject({
    tronc: z.array(id).min(1),
    voies: z.array(z.strictObject({
      id,
      ouvrage: id,
      numero: z.string().min(1),
      transmetteurs: z.array(id).min(1),
    })),
  }),
});

export const fichierHadiths = z.strictObject({
  version,
  miseAJour: date,
  statut: z.enum(["exemple-a-valider", "valide-specialiste"]),
  hadiths: z.array(hadith).min(1),
});

export type Bibliotheque = z.infer<typeof bibliotheque>;
export type Ouvrage = z.infer<typeof ouvrage>;
export type Transmetteur = z.infer<typeof transmetteur>;
export type CategorieTransmetteur = z.infer<typeof categorieTransmetteur>;
export type Hadith = z.infer<typeof hadith>;
export type Occurrence = z.infer<typeof occurrence>;
export type TexteMultilingue = z.infer<typeof texteMultilingue>;
