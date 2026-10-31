import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-import-auth";
export const runtime="nodejs";
export async function GET(){
  return NextResponse.json({configured:isAdminConfigured(),authenticated:await isAdminAuthenticated()},{
    headers:{"Cache-Control":"no-store"}
  });
}
