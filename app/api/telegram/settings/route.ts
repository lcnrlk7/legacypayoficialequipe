import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/auth";

const sql = neon(process.env.DATABASE_URL!);

// GET - Buscar configuracoes e usuarios
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ceo") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Buscar configuracoes
    const settingsResult = await sql`
      SELECT * FROM telegram_settings LIMIT 1
    `;

    // Buscar usuarios vinculados
    const usersResult = await sql`
      SELECT 
        tu.*,
        p.name as user_name,
        p.email as user_email
      FROM telegram_users tu
      JOIN profiles p ON tu.user_id = p.id
      ORDER BY tu.created_at DESC
    `;

    return NextResponse.json({
      settings: settingsResult[0] || null,
      users: usersResult,
    });
  } catch (error) {
    console.error("Erro ao buscar configuracoes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT - Atualizar configuracoes
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ceo") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bot_enabled,
      sales_channel_id,
      announcements_channel_id,
      support_group_id,
      notify_deposits,
      notify_withdrawals,
    } = body;

    // Verificar se existe configuracao
    const existing = await sql`SELECT id FROM telegram_settings LIMIT 1`;

    if (existing.length === 0) {
      // Criar
      await sql`
        INSERT INTO telegram_settings (
          bot_enabled, sales_channel_id, announcements_channel_id, 
          support_group_id, notify_deposits, notify_withdrawals
        ) VALUES (
          ${bot_enabled}, ${sales_channel_id}, ${announcements_channel_id},
          ${support_group_id}, ${notify_deposits}, ${notify_withdrawals}
        )
      `;
    } else {
      // Atualizar
      await sql`
        UPDATE telegram_settings SET
          bot_enabled = ${bot_enabled},
          sales_channel_id = ${sales_channel_id},
          announcements_channel_id = ${announcements_channel_id},
          support_group_id = ${support_group_id},
          notify_deposits = ${notify_deposits},
          notify_withdrawals = ${notify_withdrawals},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar configuracoes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
