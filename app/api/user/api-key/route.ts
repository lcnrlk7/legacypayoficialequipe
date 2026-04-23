import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import crypto from "crypto";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const newKey = "lp_" + crypto.randomUUID().replace(/-/g, "");

    await sql`
      UPDATE profiles 
      SET api_key = ${newKey}
      WHERE id = ${session.userId}
    `;

    return NextResponse.json({ success: true, apiKey: newKey });
  } catch (error) {
    console.error("[v0] Error regenerating API key:", error);
    return NextResponse.json(
      { error: "Erro ao regenerar chave API" },
      { status: 500 }
    );
  }
}
