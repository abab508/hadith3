import { z } from "zod";

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const nombre = z.number().int().nonnegative();
const titre = { ar: z.string().min(1), fr: z.string().min(1).nullable() };
const sousChapitre = z.strictObject({ id: z.string().regex(/^s[0-9]+$/), ...titre, nombre });
const chapitre = z.strictObject({ theme: id, ...titre, sujet: z.number().int().positive(), nombre, sous: z.array(sousChapitre) });

export const indexChapitres = z.strictObject({
  version: z.number().int().positive(), source: z.string().min(1),
  themes: z.record(id, z.array(id)), chapitres: z.record(id, chapitre),
}).superRefine((index, ctx) => {
  const visites = new Set<string>();
  for (const [theme, ids] of Object.entries(index.themes)) {
    for (const cle of ids) {
      const c = Object.hasOwn(index.chapitres, cle) ? index.chapitres[cle] : undefined;
      if (!c || c.theme !== theme || visites.has(cle)) ctx.addIssue({ code: "custom", message: "Chapitre absent, dupliqué ou rattaché au mauvais thème", path: ["themes", theme] });
      visites.add(cle);
    }
  }
  if (visites.size !== Object.keys(index.chapitres).length) ctx.addIssue({ code: "custom", message: "Chapitre sans thème" });
  for (const [cle, c] of Object.entries(index.chapitres)) {
    if (new Set(c.sous.map((s) => s.id)).size !== c.sous.length) ctx.addIssue({ code: "custom", message: "Sous-chapitre dupliqué", path: ["chapitres", cle] });
  }
});

const refs = z.record(z.string().regex(/^[hr]\/[a-z0-9]+(-[a-z0-9]+)*$/), z.array(z.number().int().positive()));
export const referencesChapitres = z.strictObject({ sous: z.record(z.string().regex(/^s[0-9]+$/), refs), autres: refs });
