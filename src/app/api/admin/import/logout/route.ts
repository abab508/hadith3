import { NextRequest,NextResponse } from "next/server";
import { secureOrigin,SESSION_COOKIE,sessionOptions } from "@/lib/admin-import-auth";
export const runtime="nodejs";
export async function POST(req:NextRequest){
  if(!secureOrigin(req))return NextResponse.json({error:"Origine non autorisée."},{status:403});
  const res=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  res.cookies.set(SESSION_COOKIE,"",{...sessionOptions(),maxAge:0});
  return res;
}
