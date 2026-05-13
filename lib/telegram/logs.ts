import { sql } from "@/lib/db";

export async function logTelegramAction(
  telegramId: number | null,
  userId: string | null,
  action: string,
  command?: string,
  data?: Record<string, unknown>
) {
  try {
    await sql`
      INSERT INTO telegram_logs (telegram_id, user_id, action, command, data)
      VALUES (${telegramId}, ${userId}, ${action}, ${command || null}, ${JSON.stringify(data || {})})
    `;
  } catch (error) {
    console.error("[Telegram] Erro ao salvar log:", error);
  }
}

export async function getTelegramLogs(limit = 50, offset = 0) {
  const logs = await sql`
    SELECT 
      tl.*,
      p.name as user_name,
      p.email as user_email,
      tu.telegram_username
    FROM telegram_logs tl
    LEFT JOIN profiles p ON tl.user_id = p.id
    LEFT JOIN telegram_users tu ON tl.telegram_id = tu.telegram_id
    ORDER BY tl.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  
  const count = await sql`SELECT COUNT(*) as total FROM telegram_logs`;
  
  return {
    logs,
    total: Number(count[0].total),
  };
}

export async function getTelegramStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await sql`
    SELECT
      (SELECT COUNT(*) FROM telegram_users WHERE is_active = true) as total_users,
      (SELECT COUNT(*) FROM telegram_logs WHERE created_at >= ${today.toISOString()}) as actions_today,
      (SELECT COUNT(*) FROM telegram_logs WHERE action = 'deposit' AND created_at >= ${today.toISOString()}) as deposits_today,
      (SELECT COUNT(*) FROM telegram_logs WHERE action = 'withdrawal' AND created_at >= ${today.toISOString()}) as withdrawals_today,
      (SELECT COUNT(DISTINCT telegram_id) FROM telegram_logs WHERE created_at >= ${today.toISOString()}) as active_users_today
  `;
  
  return stats[0];
}
