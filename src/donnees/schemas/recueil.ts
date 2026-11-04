import { z } from "zod";

// Catalogue des recueils de hadiths (bibliothèque) : liste fournie par le patron, à valider par un spécialiste.
// Les noms arabes sont stockés en Unicode NFC et jamais modifiés.

const nfc = z.string().min(1).refine((texte) => texte === texte.normalize("NFC"), "texte non NFC");
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const familleRecueil = z.enum([
  "neuf",
  "transmission",
  "musnad",
  "specialises",
  "compilations",
  "anciens",
  "imamite",
  "ibadite",
]);

export const recueil = z.strictObject({
  numero: z.number().int().positive(),
  id,
  famille: familleRecueil,
  nomAr: nfc,
  nom: z.string().min(1),
  // Absent quand la source ne le donne pas : jamais deviné.
  auteur: z.string().min(1).optional(),
});

export const fichierRecueils = z.strictObject({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  miseAJour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statut: z.enum(["a-valider", "valide"]),
  source: z.string().min(1),
  familles: z.array(familleRecueil).min(1),
  recueils: z.array(recueil).min(1),
});

export type FamilleRecueil = z.infer<typeof familleRecueil>;
export type Recueil = z.infer<typeof recueil>;
export type FichierRecueils = z.infer<typeof fichierRecueils>;
