import { NextRequest, NextResponse } from "next/server";
import { getTelegramLogs, getTelegramStats } from "@/lib/telegram/logs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;
    
    const [logsData, stats, users] = await Promise.all([
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
      `
    ]);
    
    return NextResponse.json({
      success: true,
      logs: logsData.logs,
      total_logs: logsData.total,
      stats,
      users,
    });
  } catch (error) {
    console.error("[API] Erro ao buscar logs:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
