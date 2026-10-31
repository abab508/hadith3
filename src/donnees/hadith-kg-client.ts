/**
 * Client serveur du corpus Hadith Knowledge Graph.
 * La base SQLite n'est jamais téléchargée par le navigateur.
 * URL privée et secret facultatif configurés exclusivement côté serveur.
 * https://github.com/emadjumaah/hadith (jeu de données CC BY 4.0).
 */
export type KgConnection =
 | {status:"not-configured"}
 | {status:"online";stats:unknown}
 | {status:"unavailable"};

const boundedUrl=(value:string):URL|null=>{
 try{
  const url=new URL(value);
  if(url.protocol!=="https:"&&!(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)))return null;
  if(url.username||url.password||url.search||url.hash)return null;
  return url;
 }catch{return null;}
};

export async function kgFetch(path:string):Promise<unknown|null>{
 const raw=process.env.HADITH_KG_API_URL;
 if(!raw||!/^\/api\/(?:stats|hadith\/\d+|rawi\/\d+|group\/\d+\/tree)$/.test(path))return null;
 const base=boundedUrl(raw);
 if(!base)return null;
 const url=new URL(path,base.origin);
 // Routes strictes : aucune URL extérieure ou chemin fourni directement par un visiteur.
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),3500);
 try{
  const response=await fetch(url,{
    signal:controller.signal,
    headers:{
      Accept:"application/json",
      ...(process.env.HADITH_KG_API_TOKEN?{Authorization:"Bearer "+process.env.HADITH_KG_API_TOKEN}:{})
    },cache:"no-store",redirect:"error",
  });
  if(!response.ok)return null;
  const type=response.headers.get("content-type")??"";
  if(!type.toLowerCase().includes("application/json"))return null;
  const body=await response.text();
  if(body.length>2_000_000)return null;
  return JSON.parse(body) as unknown;
 }catch{return null;}finally{clearTimeout(timeout);}
}
export async function kgConnection():Promise<KgConnection>{
 if(!process.env.HADITH_KG_API_URL)return {status:"not-configured"};
 const stats=await kgFetch("/api/stats");
 return stats?{status:"online",stats}:{status:"unavailable"};
}
