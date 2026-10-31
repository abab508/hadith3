import "server-only";
import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE="milaghaiba_import_session";
const TTL=60*60*2;
const secret=()=>process.env.HADITH_IMPORT_SESSION_SECRET??"";
export const isAdminConfigured=()=>Boolean(
  (process.env.HADITH_ADMIN_PASSWORD?.length??0)>=16 &&
  secret().length>=32 &&
  (process.env.HADITH_IMPORT_GITHUB_TOKEN?.length??0)>20
);
function safeCompare(a:string,b:string){
  const x=createHash("sha256").update(a).digest();
  const y=createHash("sha256").update(b).digest();
  return timingSafeEqual(x,y);
}
export function verifyAdminPassword(password:string){
  return isAdminConfigured() && safeCompare(password,process.env.HADITH_ADMIN_PASSWORD!);
}
function sign(input:string){return createHmac("sha256",secret()).update(input).digest("hex");}
export function createSession(){
  const body=(Math.floor(Date.now()/1000)+TTL)+"."+randomBytes(18).toString("hex");
  return body+"."+sign(body);
}
export function verifySession(value?:string){
  if(!isAdminConfigured()||!value)return false;
  const parts=value.split(".");
  if(parts.length!==3||!parts[0]||!parts[1]||!parts[2])return false;
  const exp=Number(parts[0]);
  if(!Number.isSafeInteger(exp)||exp<Math.floor(Date.now()/1000)||exp>Math.floor(Date.now()/1000)+TTL)return false;
  return safeCompare(parts[2]!,sign(parts[0]+"."+parts[1]));
}
export async function isAdminAuthenticated(){
  const store=await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}
export function secureOrigin(request:NextRequest){
  const origin=request.headers.get("origin");
  if(!origin)return false;
  try{return new URL(origin).origin===request.nextUrl.origin && (request.headers.get("sec-fetch-site")??"same-origin")!=="cross-site";}
  catch{return false;}
}
export function sessionOptions(){
  return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/",maxAge:TTL};
}
