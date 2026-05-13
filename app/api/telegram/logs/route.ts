import { NextRequest, NextResponse } from "next/server";
import { getTelegramLogs, getTelegramStats } from "@/lib/telegram/logs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;
    
    const [logsData, stats, botUsers, botTransactions, settings, webhookInfo] = await Promise.all([
      getTelegramLogs(limit, offset),
      getTelegramStats(),
      // Usuarios do bot (tabela independente)
      sql`
        SELECT * FROM bot_users
        ORDER BY updated_at DESC
        LIMIT 100
      `,
      // Transacoes do bot (tabela independente)
      sql`
        SELECT * FROM bot_transactions
        ORDER BY created_at DESC
        LIMIT 100
      `,
      // Configuracoes
      sql`SELECT * FROM telegram_settings LIMIT 1`,
      // Info do webhook
      getWebhookInfo()
    ]);
    
    // Estatisticas das tabelas do bot
    const botStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM bot_users) as total_users,
        (SELECT COUNT(*) FROM bot_users WHERE updated_at >= CURRENT_DATE) as users_today,
        (SELECT COALESCE(SUM(balance), 0) FROM bot_users) as total_balance,
        (SELECT COALESCE(SUM(total_deposited), 0) FROM bot_users) as total_deposited,
        (SELECT COALESCE(SUM(total_withdrawn), 0) FROM bot_users) as total_withdrawn
    `;
    
    // Transacoes de hoje
    const todayStats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'deposit' AND status = 'completed') as deposits_today,
        COUNT(*) FILTER (WHERE type = 'withdrawal' AND status = 'completed') as withdrawals_today,
        COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'completed'), 0) as deposit_amount_today,
        COALESCE(SUM(amount) FILTER (WHERE type = 'withdrawal' AND status = 'completed'), 0) as withdrawal_amount_today,
        COALESCE(SUM(fee) FILTER (WHERE status = 'completed'), 0) as fees_today
      FROM bot_transactions
      WHERE created_at >= CURRENT_DATE
    `;
    
    // Totais gerais
    const totalStats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'deposit' AND status = 'completed') as total_deposits,
        COUNT(*) FILTER (WHERE type = 'withdrawal' AND status = 'completed') as total_withdrawals,
        COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'completed'), 0) as total_deposit_amount,
        COALESCE(SUM(amount) FILTER (WHERE type = 'withdrawal' AND status = 'completed'), 0) as total_withdrawal_amount,
        COALESCE(SUM(fee), 0) as total_fees,
        COALESCE(SUM(net_amount) FILTER (WHERE type = 'deposit' AND status = 'completed'), 0) as total_net_deposits,
        COALESCE(SUM(net_amount) FILTER (WHERE type = 'withdrawal' AND status = 'completed'), 0) as total_net_withdrawals
      FROM bot_transactions
    `;
    
    // Saques pendentes
    const pendingWithdrawals = await sql`
      SELECT * FROM bot_transactions
      WHERE type = 'withdrawal' AND status IN ('pending', 'processing')
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json({
      success: true,
      logs: logsData.logs,
      total_logs: logsData.total,
      stats: {
        ...stats,
        ...botStats[0],
        ...todayStats[0],
        ...totalStats[0],
      },
      users: botUsers,
      transactions: botTransactions,
      pending_withdrawals: pendingWithdrawals,
      settings: settings[0] || null,
      webhook: webhookInfo,
    });
  } catch (error) {
    console.error("[API] Erro ao buscar logs:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function getWebhookInfo() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    
    if (data.ok) {
      return {
        url: data.result.url,
        pending_count: data.result.pending_update_count,
        last_error: data.result.last_error_message,
        last_error_date: data.result.last_error_date,
      };
    }
    return null;
  } catch {
    return null;
  }
}
