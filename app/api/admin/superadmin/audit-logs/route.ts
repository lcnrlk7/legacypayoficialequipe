import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const action = url.searchParams.get("action");

    let query = `
      SELECT 
        al.id,
        al.actor_id,
        ap.email as actor_email,
        ap.name as actor_name,
        al.action,
        al.target_id,
        al.details,
        al.created_at
      FROM audit_logs al
      LEFT JOIN profiles ap ON ap.id = al.actor_id
    `;

    const params: unknown[] = [];

    if (action) {
      query += ` WHERE al.action = $${params.length + 1}`;
      params.push(action);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const logs = await sql(query as any, ...params);

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs${action ? ` WHERE action = $1` : ''}`;
    const countParams = action ? [action] : [];
    const countResult = await sql(countQuery as any, ...countParams);

    return NextResponse.json({
      logs,
      total: countResult[0]?.total || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error("[v0] Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logs de auditoria" },
      { status: 500 }
    );
  }
}
