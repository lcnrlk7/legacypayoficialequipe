import { NextRequest, NextResponse } from "next/server";
import { getTelegramLogs, getTelegramStats } from "@/lib/telegram/logs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;
    
    const [logsData, stats, users, transactions, settings, webhookInfo] = await Promise.all([
      getTelegramLogs(limit, offset),
      getTelegramStats(),
      sql`
        SELECT 
          tu.*,
          p.name,
          p.email,
          p.balance
        FROM telegram_users tu
        JOIN profiles p ON tu.user_id = p.id
        WHERE tu.is_active = true
        ORDER BY tu.created_at DESC
      `,
      // Transacoes do Telegram (ultimos 30 dias)
      sql`
        SELECT 
          t.id,
          t.user_id,
          t.type,
          t.amount,
          t.fee,
          t.net_amount,
          t.status,
          t.created_at,
          p.name as user_name,
          p.email as user_email
        FROM transactions t
        JOIN profiles p ON t.user_id = p.id
        WHERE t.metadata->>'source' = 'telegram'
          AND t.created_at > NOW() - INTERVAL '30 days'
        ORDER BY t.created_at DESC
        LIMIT 50
      `,
      // Configuracoes
      sql`SELECT * FROM telegram_settings LIMIT 1`,
      // Info do webhook (buscar do Telegram)
      getWebhookInfo()
    ]);
    
    // Calcular estatisticas de transacoes
    const telegramTransactions = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'pix' AND status = 'completed') as total_deposits,
        COUNT(*) FILTER (WHERE type = 'withdrawal' AND status = 'completed') as total_withdrawals,
        COALESCE(SUM(net_amount) FILTER (WHERE type = 'pix' AND status = 'completed'), 0) as total_deposit_amount,
        COALESCE(SUM(net_amount) FILTER (WHERE type = 'withdrawal' AND status = 'completed'), 0) as total_withdrawal_amount,
        COALESCE(SUM(fee) FILTER (WHERE status = 'completed'), 0) as total_fees
      FROM transactions
      WHERE metadata->>'source' = 'telegram'
    `;
    
    // Transacoes de hoje
    const todayTransactions = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'pix' AND status = 'completed') as deposits_today,
        COUNT(*) FILTER (WHERE type = 'withdrawal' AND status = 'completed') as withdrawals_today,
        COALESCE(SUM(net_amount) FILTER (WHERE type = 'pix' AND status = 'completed'), 0) as deposit_amount_today,
        COALESCE(SUM(net_amount) FILTER (WHERE type = 'withdrawal' AND status = 'completed'), 0) as withdrawal_amount_today,
        COALESCE(SUM(fee) FILTER (WHERE status = 'completed'), 0) as fees_today
      FROM transactions
      WHERE metadata->>'source' = 'telegram'
        AND created_at >= CURRENT_DATE
    `;
    
    // Saques pendentes
    const pendingWithdrawals = await sql`
      SELECT 
        w.id,
        w.user_id,
        w.amount,
        w.fee,
        w.net_amount,
        w.pix_key,
        w.status,
        w.created_at,
        p.name as user_name,
        p.email as user_email
      FROM withdrawals w
      JOIN profiles p ON w.user_id = p.id
      WHERE w.metadata->>'source' = 'telegram'
        AND w.status IN ('pending', 'processing')
      ORDER BY w.created_at DESC
    `;
    
    return NextResponse.json({
      success: true,
      logs: logsData.logs,
      total_logs: logsData.total,
      stats: {
        ...stats,
        ...telegramTransactions[0],
        ...todayTransactions[0],
      },
      users,
      transactions,
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
