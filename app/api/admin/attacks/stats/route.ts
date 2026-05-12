import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { getAttackStats } from "@/lib/attack-logger";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "ceo")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const stats = await getAttackStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API Attack Stats] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
