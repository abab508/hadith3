// Clés de traduction des thèmes et chapitres, écrites en entier (jamais construites par concaténation).
import type { z } from "zod";
import type { cleChapitre, cleTheme } from "@/donnees/themes";

export const clesThemes = {
  croyance: { titre: "liste.croyance.titre", description: "liste.croyance.description" },
  adoration: { titre: "liste.adoration.titre", description: "liste.adoration.description" },
  prophete: { titre: "liste.prophete.titre", description: "liste.prophete.description" },
  relations: { titre: "liste.relations.titre", description: "liste.relations.description" },
  comportements: { titre: "liste.comportements.titre", description: "liste.comportements.description" },
  finDesTemps: { titre: "liste.finDesTemps.titre", description: "liste.finDesTemps.description" },
  science: { titre: "liste.science.titre", description: "liste.science.description" },
  maladies: { titre: "liste.maladies.titre", description: "liste.maladies.description" },
  autres: { titre: "liste.autres.titre", description: "liste.autres.description" },
} as const satisfies Record<z.infer<typeof cleTheme>, { titre: string; description: string }>;

// sousTitre et intro n'existent que pour certains chapitres (null sinon : rien n'est inventé).
export const clesChapitres = {
  signesMineurs: { titre: "liste.signesMineurs.titre", sousTitre: "liste.signesMineurs.sousTitre", intro: "liste.signesMineurs.intro" },
  signesMajeurs: { titre: "liste.signesMajeurs.titre", sousTitre: "liste.signesMajeurs.sousTitre", intro: null },
  dajjal: { titre: "liste.dajjal.titre", sousTitre: null, intro: null },
  issa: { titre: "liste.issa.titre", sousTitre: null, intro: null },
  finDuMonde: { titre: "liste.finDuMonde.titre", sousTitre: null, intro: null },
} as const satisfies Record<z.infer<typeof cleChapitre>, { titre: string; sousTitre: string | null; intro: string | null }>;
