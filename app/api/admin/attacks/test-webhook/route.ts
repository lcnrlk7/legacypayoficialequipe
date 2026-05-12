import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { testDiscordWebhook } from "@/lib/attack-logger";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "ceo")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const success = await testDiscordWebhook();

    if (success) {
      return NextResponse.json({ message: "Webhook enviado com sucesso!" });
    } else {
      return NextResponse.json({ error: "Falha ao enviar webhook" }, { status: 500 });
    }
  } catch (error) {
    console.error("[API Test Webhook] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
