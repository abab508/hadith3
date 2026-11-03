import brut from "../../data/themes/classification.json";
import { z } from "zod";

const identifiant = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nom = z.object({fr:z.string().min(1),ar:z.string().min(1),en:z.string().min(1)}).strict();
export const schemaClassification = z.object({
 version:z.number().int().positive(),
 description:z.string().min(1),
 sources:z.array(z.string().url()).min(1),
 chapitres:z.array(z.object({
  slug:identifiant, fond:z.enum(["cosmos","eau","sobre"]),nom,
  themes:z.array(z.object({slug:identifiant,nom}).strict()).min(1)
 }).strict()).min(1)
}).strict().superRefine((donnees,ctx)=>{
 const chapitres=new Set<string>();
 donnees.chapitres.forEach((chapitre,i)=>{
  if(chapitres.has(chapitre.slug))ctx.addIssue({code:"custom",message:"Chapitre répété",path:["chapitres",i,"slug"]});
  chapitres.add(chapitre.slug);
  const themes=new Set<string>();
  chapitre.themes.forEach((theme,j)=>{
   if(themes.has(theme.slug))ctx.addIssue({code:"custom",message:"Sous-thème répété",path:["chapitres",i,"themes",j,"slug"]});
   themes.add(theme.slug);
  });
 });
});
export const classification=schemaClassification.parse(brut);
export type Chapitre=typeof classification.chapitres[number];
export const langueThemes=(locale:string):"fr"|"ar"|"en"=>
 locale==="ar"?"ar":locale==="en"?"en":"fr";
export function chapitreParSlug(slug:string){return classification.chapitres.find(c=>c.slug===slug);}
