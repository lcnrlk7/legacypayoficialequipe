import { NextRequest, NextResponse } from "next/server";
import { sendAnnouncement } from "@/lib/telegram/bot";
import { getCurrentUser } from "@/lib/auth";

// POST - Enviar aviso para o canal
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "ceo") {
      return NextResponse.json(
        { error: "Nao autorizado" },
        { status: 401 }
      );
    }
    
    const { message } = await request.json();
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Mensagem e obrigatoria" },
        { status: 400 }
      );
    }
    
    await sendAnnouncement(message);
    
    return NextResponse.json({ 
      success: true, 
      message: "Aviso enviado com sucesso" 
    });
  } catch (error) {
    console.error("[Telegram] Erro ao enviar aviso:", error);
    return NextResponse.json(
      { error: "Erro ao enviar aviso" },
      { status: 500 }
    );
  }
}
