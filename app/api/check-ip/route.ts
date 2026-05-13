import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Pegar IP do header
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") ||
               "unknown";

    if (ip === "unknown") {
      return NextResponse.json({ blocked: false });
    }

    const blockedIp = await sql`
      SELECT id FROM blocked_ips WHERE ip_address = ${ip}
    `;

    return NextResponse.json({ 
      blocked: blockedIp.length > 0,
      ip: ip
    });
  } catch (error) {
    console.error("Erro ao verificar IP:", error);
    return NextResponse.json({ blocked: false });
  }
}
