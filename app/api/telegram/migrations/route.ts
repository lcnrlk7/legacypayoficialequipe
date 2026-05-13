import { NextResponse } from "next/server";
import { sql } from "@/lib/db";


export async function POST(request: Request) {
  // Verificar autorizacao
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }
  
  try {
    // Adicionar colunas para sistema de lembretes na tabela bot_transactions
    await sql`
      ALTER TABLE bot_transactions 
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE
    `;
    
    await sql`
      ALTER TABLE bot_transactions 
      ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP
    `;
    
    // Adicionar colunas para sistema de lembretes na tabela bot_users
    await sql`
      ALTER TABLE bot_users 
      ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP
    `;
    
    await sql`
      ALTER TABLE bot_users 
      ADD COLUMN IF NOT EXISTS low_balance_alert_at TIMESTAMP
    `;
    
    return NextResponse.json({
      success: true,
      message: "Migracoes aplicadas com sucesso",
      columns_added: [
        "bot_transactions.reminder_sent",
        "bot_transactions.reminder_sent_at",
        "bot_users.last_reminder_at",
        "bot_users.low_balance_alert_at",
      ],
    });
    
  } catch (error) {
    console.error("[Migration] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao aplicar migracoes", details: String(error) },
      { status: 500 }
    );
  }
}
