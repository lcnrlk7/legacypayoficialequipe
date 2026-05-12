import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { getAttackLogs } from "@/lib/attack-logger";

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

    const logs = await getAttackLogs(200);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[API Attacks] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
