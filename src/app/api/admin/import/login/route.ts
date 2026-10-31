import { NextRequest, NextResponse } from "next/server";
import {
  createSession,isAdminConfigured,secureOrigin,SESSION_COOKIE,sessionOptions,verifyAdminPassword
} from "@/lib/admin-import-auth";
export const runtime="nodejs";
const attempts=new Map<string,{count:number;since:number}>();
export async function POST(req:NextRequest){
  if(!secureOrigin(req))return NextResponse.json({error:"Origine non autorisée."},{status:403});
  if(!isAdminConfigured())return NextResponse.json({error:"Administration non configurée."},{status:503});
  const ip=(req.headers.get("x-real-ip")??req.headers.get("x-forwarded-for")?.split(",")[0]??"unknown").slice(0,70);
  const now=Date.now(),entry=attempts.get(ip);
  const state=entry&&now-entry.since<15*60_000?entry:{count:0,since:now};
  if(state.count>=8)return NextResponse.json({error:"Trop de tentatives. Réessayez plus tard."},{status:429,headers:{"Retry-After":"900"}});
  let password="";
  try{
    if(Number(req.headers.get("content-length")??0)>2048)return NextResponse.json({error:"Requête trop grande."},{status:413});
    const body=await req.json() as {password?:unknown};
    if(typeof body.password==="string"&&body.password.length<=256)password=body.password;
  }catch {return NextResponse.json({error:"Requête invalide."},{status:400});}
  if(!verifyAdminPassword(password)){
    state.count++;
    attempts.set(ip,state);
    return NextResponse.json({error:"Identifiant incorrect."},{status:401,headers:{"Cache-Control":"no-store"}});
  }
  attempts.delete(ip);
  const res=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  res.cookies.set(SESSION_COOKIE,createSession(),sessionOptions());
  return res;
}
