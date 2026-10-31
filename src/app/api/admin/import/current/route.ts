import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-import-auth";
import { readGithubIndex } from "@/lib/admin-import-github";
export const runtime="nodejs";
export async function GET(){
  if(!await isAdminAuthenticated())return NextResponse.json({error:"Accès réservé."},{status:401,headers:{"Cache-Control":"no-store"}});
  try{
    const data=await readGithubIndex();
    return NextResponse.json({
      existing:data.index.hadiths.map(x=>({id:x.id,recueil:x.recueil,numero:x.numero})),
      total:data.index.hadiths.length
    },{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Impossible de lire l'index GitHub actuel."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
