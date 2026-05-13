import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    // Total de admins
    const adminsCount = await sql`
      SELECT COUNT(*) as total FROM admin_team WHERE is_active = true
    `;

    // Admins por role
    const adminsByRole = await sql`
      SELECT role, COUNT(*) as count 
      FROM admin_team 
      WHERE is_active = true
      GROUP BY role
    `;

    // Atividades de auditoria hoje
    const auditToday = await sql`
      SELECT COUNT(*) as total 
      FROM audit_logs 
      WHERE DATE(created_at) = CURRENT_DATE
    `;

    // Total de transações (from transactions table if exists)
    const transactionsCount = await sql`
      SELECT COUNT(*) as total FROM pix_transactions
    `;

    // Volume total de transações
    const volumeTotal = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM pix_transactions
    `;

    // Transações por dia (últimos 7 dias)
    const transactionsPerDay = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as volume
      FROM pix_transactions
      WHERE created_at >= CURRENT_DATE - INTERVAL 7 DAY
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
    `;

    // Últimas atividades
    const recentActivities = await sql`
      SELECT 
        al.id,
        al.actor_id,
        p.email as actor_email,
        p.name as actor_name,
        al.action,
        al.created_at
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.actor_id
      ORDER BY al.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      summary: {
        totalAdmins: adminsCount[0]?.total || 0,
        adminsByRole: adminsByRole || [],
        auditTodayCount: auditToday[0]?.total || 0,
        totalTransactions: transactionsCount[0]?.total || 0,
        totalVolume: volumeTotal[0]?.total || 0
      },
      transactionsPerDay: transactionsPerDay || [],
      recentActivities: recentActivities || []
    });
  } catch (error) {
    console.error("[v0] Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Erro ao buscar métricas" },
      { status: 500 }
    );
  }
}
