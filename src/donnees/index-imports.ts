import donnees from "../../data/hadiths/index-imports.json" with { type: "json" };
import { z } from "zod";
import { normaliser } from "@/donnees/recherche";

const itemSchema = z.strictObject({
  id:z.string().min(3),
  recueil:z.string().min(2),
  recueilAr:z.string().min(2),
  recueilLatin:z.string().min(2),
  numero:z.string().min(1),
  livreNumero:z.string().min(1),
  texteAr:z.string().min(10),
  source:z.string().min(1),
  fichierSource:z.string().url(),
  statut:z.literal("importe-non-verifie"),
});
const schema = z.strictObject({
  version:z.string(),
  statut:z.literal("importe-non-verifie"),
  source:z.string(),
  revision:z.string(),
  license:z.string(),
  hadiths:z.array(itemSchema),
});
export const indexImporte = schema.parse(donnees);
export type NoticeImportee = z.infer<typeof itemSchema>;
const notices = indexImporte.hadiths;
const normalises = notices.map((h)=>normaliser([h.texteAr,h.recueilAr,h.recueilLatin,h.numero].join(" ")));

export const recueilsImportes = [...new Map(notices.map(h=>[h.recueil,{id:h.recueil,nom:h.recueilLatin,nomAr:h.recueilAr}])).values()];

export function chercherNoticesImportees(
  saisie:string, recueil:string|undefined, pageDemandee:number, taille=10,
) {
  const mots=normaliser(saisie.slice(0,140)).split(" ").filter(Boolean);
  const numero=saisie.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660));
  const numeroExact=/^\d+$/.test(numero)?String(Number(numero)):null;
  const trouves=notices.filter((h,i)=>{
    if(recueil && h.recueil!==recueil)return false;
    if(numeroExact)return h.numero===numeroExact;
    const texte=normalises[i]??"";
    // Tous les mots doivent être présents; accepte l'article ال dans les recherches arabes.
    return mots.every(m=>texte.includes(m)||texte.includes("ال"+m));
  });
  const pageTotal=Math.max(1,Math.ceil(trouves.length/taille));
  const page=Number.isSafeInteger(pageDemandee)&&pageDemandee>0?Math.min(pageDemandee,pageTotal):1;
  return {total:trouves.length,page,pageTotal,items:trouves.slice((page-1)*taille,page*taille)};
}
