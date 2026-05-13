import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const results: string[] = [];

    // Criar tabela push_subscriptions se nao existir
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, endpoint)
      )
    `;
    results.push("push_subscriptions table created/verified");

    // Adicionar coluna push_subscription em profiles se nao existir
    await sql`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS push_subscription JSONB
    `;
    results.push("profiles.push_subscription column added");

    // Adicionar coluna notifications_push em profiles se nao existir
    await sql`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS notifications_push BOOLEAN DEFAULT false
    `;
    results.push("profiles.notifications_push column added");

    // Adicionar coluna require_address em checkouts se nao existir
    await sql`
      ALTER TABLE checkouts 
      ADD COLUMN IF NOT EXISTS require_address BOOLEAN DEFAULT false
    `;
    results.push("checkouts.require_address column added");

    // Colunas para sistema de lembretes do bot
    await sql`
      ALTER TABLE bot_transactions 
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE
    `;
    results.push("bot_transactions.reminder_sent column added");

    await sql`
      ALTER TABLE bot_transactions 
      ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP
    `;
    results.push("bot_transactions.reminder_sent_at column added");

    await sql`
      ALTER TABLE bot_users 
      ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP
    `;
    results.push("bot_users.last_reminder_at column added");

    await sql`
      ALTER TABLE bot_users 
      ADD COLUMN IF NOT EXISTS low_balance_alert_at TIMESTAMP
    `;
    results.push("bot_users.low_balance_alert_at column added");

    return NextResponse.json({
      success: true,
      message: "Todas as migracoes aplicadas com sucesso",
      migrations: results,
    });
  } catch (error) {
    console.error("[Migrations] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao aplicar migracoes", details: String(error) },
      { status: 500 }
    );
  }
}
