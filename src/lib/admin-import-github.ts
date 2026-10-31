import "server-only";
import type { ImportedNotice } from "@/donnees/import-csv";

const REPO="abab508/hadith3";
const BRANCH="main";
const FILE="data/hadiths/index-imports.json";
const URL="https://api.github.com/repos/"+REPO+"/contents/"+FILE;
function authHeaders(){return {
  Authorization:"Bearer "+process.env.HADITH_IMPORT_GITHUB_TOKEN,
  Accept:"application/vnd.github+json",
  "X-GitHub-Api-Version":"2022-11-28",
  "User-Agent":"Milaghaiba-Hadith-Import",
};}
type GithubContent={sha:string;content:string;encoding:string;};
type Index={version:string;statut:string;source:string;revision:string;license:string;hadiths:ImportedNotice[]};
export async function readGithubIndex(){
  if(!process.env.HADITH_IMPORT_GITHUB_TOKEN)throw Error("GitHub token not configured");
  const res=await fetch(URL+"?ref="+BRANCH,{headers:authHeaders(),cache:"no-store",signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw Error("GitHub read refused: "+res.status);
  const body=await res.json() as GithubContent;
  if(body.encoding!=="base64"||!body.sha)throw Error("Unsupported GitHub content.");
  const data=JSON.parse(Buffer.from(body.content.replace(/\s/g,""),"base64").toString("utf8")) as Index;
  if(!Array.isArray(data.hadiths)||typeof data.version!=="string")throw Error("Malformed index.");
  return {sha:body.sha,index:data};
}
export async function appendToGithub(notices:ImportedNotice[],snapshot?:Awaited<ReturnType<typeof readGithubIndex>>){
  const {sha,index}=snapshot??await readGithubIndex();
  if(index.hadiths.length+notices.length>30000)throw Error("Index file size limit exceeded.");
  const all=[...index.hadiths,...notices];
  const payload={...index,hadiths:all};
  const content=Buffer.from(JSON.stringify(payload,null,2)+"\n","utf8").toString("base64");
  const response=await fetch(URL,{method:"PUT",headers:{...authHeaders(),"Content-Type":"application/json"},
    body:JSON.stringify({message:"data: ajouter "+notices.length+" hadith(s) CSV sans écrasement",branch:BRANCH,sha,content}),
    cache:"no-store",signal:AbortSignal.timeout(18000)});
  if(response.status===409||response.status===422)throw Error("CONFLICT: repository changed during save; retry preview.");
  if(!response.ok)throw Error("GitHub save refused: "+response.status);
  const result=await response.json() as {commit?:{sha?:string}};
  return {added:notices.length,total:all.length,commit:result.commit?.sha??""};
}
