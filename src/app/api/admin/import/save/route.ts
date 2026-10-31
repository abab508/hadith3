import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated,secureOrigin } from "@/lib/admin-import-auth";
import { readGithubIndex,appendToGithub } from "@/lib/admin-import-github";
import { validateRows,summaryRows } from "@/donnees/import-csv";
export const runtime="nodejs";
const entry=z.record(z.string().max(80),z.string().max(12000));
const request=z.strictObject({rows:z.array(entry).min(1).max(200)});
export async function POST(req:NextRequest){
  if(!secureOrigin(req))return NextResponse.json({error:"Origine non autorisée."},{status:403});
  if(!await isAdminAuthenticated())return NextResponse.json({error:"Accès réservé."},{status:401});
  if(Number(req.headers.get("content-length")??0)>1_500_000)
    return NextResponse.json({error:"Fichier trop volumineux."},{status:413});
  let body:unknown;
  try{body=await req.json();}catch{return NextResponse.json({error:"Format de requête invalide."},{status:400});}
  const parsed=request.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Colonnes ou valeurs non valides."},{status:400});
  try{
    // Lire la version courante juste avant d'écrire; contrôle de SHA optimiste
    // sur GitHub : toute modification simultanée bloque la sauvegarde.
    const snapshot=await readGithubIndex();
    const results=validateRows(parsed.data.rows,snapshot.index.hadiths);
    const summary=summaryRows(results);
    if(summary.blocked>0)return NextResponse.json({
      error:"L'import est refusé : toutes les lignes doivent être valides et nouvelles.",
      summary,rows:results.map(x=>({line:x.line,errors:x.errors})).filter(x=>x.errors.length>0)
    },{status:409,headers:{"Cache-Control":"no-store"}});
    const notices=results.flatMap(x=>x.notice?[x.notice]:[]);
    const saved=await appendToGithub(notices,snapshot);
    return NextResponse.json({ok:true,...saved},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    const conflict=e instanceof Error&&e.message.startsWith("CONFLICT");
    return NextResponse.json({error:conflict?
      "Le dépôt a été modifié entre la prévisualisation et l'enregistrement. Actualisez avant de réessayer.":
      "Échec de sauvegarde GitHub. Vérifiez le jeton et les droits sur le dépôt."},
      {status:conflict?409:503,headers:{"Cache-Control":"no-store"}});
  }
}
