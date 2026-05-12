import { NextRequest, NextResponse } from "next/server";
import { handleTextMessage, handleCallback } from "@/lib/telegram/commands";
import type { TelegramUpdate } from "@/lib/telegram/bot";

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    
    console.log("[Telegram] Webhook recebido:", JSON.stringify(update, null, 2));
    
    // Processar mensagem de texto
    if (update.message?.text) {
      const { chat, from, text } = update.message;
      
      // Ignorar mensagens de grupos/canais por enquanto (apenas privado)
      if (chat.type !== "private") {
        return NextResponse.json({ ok: true });
      }
      
      await handleTextMessage(
        chat.id,
        from.id,
        text,
        from.first_name
      );
    }
    
    // Processar callback (botoes inline)
    if (update.callback_query) {
      const { id, from, message, data } = update.callback_query;
      
      if (message && data) {
        await handleCallback(
          id,
          message.chat.id,
          message.message_id,
          from.id,
          data
        );
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram] Erro no webhook:", error);
    return NextResponse.json({ ok: true }); // Sempre retornar 200 para o Telegram
  }
}

// GET para verificacao do webhook
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Telegram webhook is active" 
  });
}
