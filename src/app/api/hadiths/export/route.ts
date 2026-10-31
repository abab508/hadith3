import { type NextRequest } from "next/server";
import { EXTERNAL_COLLECTIONS,fetchRemoteEdition,exportEditionCsv,canUseRemote } from "@/donnees/recherche-distante";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
  const recueil=request.nextUrl.searchParams.get("recueil")??"";
  const langue=request.nextUrl.searchParams.get("langue")??"";
  const collection=EXTERNAL_COLLECTIONS.find(c=>c.id===recueil);
  if(!collection||!["ara","fra","eng","ind","tur","urd"].includes(langue)||!canUseRemote(collection,langue)){
    return Response.json({error:"Recueil ou édition invalide ou non disponible."},{status:400});
  }
  try{
    const data=await fetchRemoteEdition(collection,langue);
    const csv=exportEditionCsv(data,collection,langue);
    if(csv.length>38_000_000)return Response.json({error:"Edition trop volumineuse pour l'export direct."},{status:413});
    return new Response(csv,{
      status:200,
      headers:{
        "Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="hadiths-'+collection.key+"-"+langue+'.csv"',
        "Cache-Control":"private, max-age=900",
        "X-Content-Type-Options":"nosniff",
        "X-Data-Provenance":"fawazahmed0-hadith-api-v1"
      }
    });
  }catch{
    return Response.json({error:"Le fournisseur du recueil ne répond pas. Réessayez plus tard."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
