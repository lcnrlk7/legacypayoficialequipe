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

    // Buscar todos os membros da equipe com suas informações
    const admins = await sql`
      SELECT 
        at.id,
        at.user_id,
        p.email,
        p.name,
        at.role,
        at.is_active,
        at.created_at,
        at.updated_at,
        (SELECT COUNT(*) FROM audit_logs WHERE actor_id = at.user_id) as action_count,
        (SELECT MAX(created_at) FROM audit_logs WHERE actor_id = at.user_id) as last_action_at
      FROM admin_team at
      INNER JOIN profiles p ON p.id = at.user_id
      ORDER BY at.created_at DESC
    `;

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("[v0] Error fetching admins:", error);
    return NextResponse.json(
      { error: "Erro ao buscar administradores" },
      { status: 500 }
    );
  }
}
