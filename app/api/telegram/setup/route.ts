import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { setWebhook } from "@/lib/telegram/bot";


// POST - Configurar webhook e salvar configuracoes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      webhookUrl,
      salesChannelId, 
      announcementsChannelId, 
      supportGroupId 
    } = body;
    
    // Configurar webhook no Telegram
    if (webhookUrl) {
      const result = await setWebhook(webhookUrl);
      console.log("[Telegram] Webhook configurado:", result);
    }
    
    // Verificar se ja existe configuracao
    const existing = await sql`SELECT id FROM telegram_settings LIMIT 1`;
    
    if (existing.length > 0) {
      // Atualizar
      await sql`
        UPDATE telegram_settings SET
          sales_channel_id = COALESCE(${salesChannelId}, sales_channel_id),
          announcements_channel_id = COALESCE(${announcementsChannelId}, announcements_channel_id),
          support_group_id = COALESCE(${supportGroupId}, support_group_id),
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      // Criar
      await sql`
        INSERT INTO telegram_settings (sales_channel_id, announcements_channel_id, support_group_id)
        VALUES (${salesChannelId || null}, ${announcementsChannelId || null}, ${supportGroupId || null})
      `;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Configuracoes salvas com sucesso" 
    });
  } catch (error) {
    console.error("[Telegram] Erro ao configurar:", error);
    return NextResponse.json(
      { error: "Erro ao configurar bot" },
      { status: 500 }
    );
  }
}

// GET - Buscar configuracoes atuais
export async function GET() {
  try {
    const settings = await sql`SELECT * FROM telegram_settings LIMIT 1`;
    const users = await sql`
      SELECT COUNT(*) as total FROM telegram_users WHERE is_active = true
    `;
    
    return NextResponse.json({
      success: true,
      settings: settings[0] || null,
      linkedUsers: Number(users[0]?.total || 0),
    });
  } catch (error) {
    console.error("[Telegram] Erro ao buscar config:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuracoes" },
      { status: 500 }
    );
  }
}
