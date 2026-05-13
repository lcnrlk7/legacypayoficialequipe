import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

/**
 * GET /api/admin/superadmin/admin-credentials?userId=XXX
 * Retorna as credenciais (email e senha) de um admin específico
 * Apenas para Super Admin
 */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    // Verificar se é super admin
    const superAdminCheck = await sql`
      SELECT role FROM admin_team 
      WHERE user_id = ${admin.userId} AND LOWER(role) = 'superadmin' AND is_active = true
    `;

    if (superAdminCheck.length === 0) {
      return NextResponse.json(
        { error: "Apenas Super Admin pode acessar credenciais" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o admin e suas credenciais
    const adminData = await sql`
      SELECT 
        at.id,
        at.user_id,
        p.email,
        p.name,
        at.role,
        p.password_hash,
        (SELECT password_plain FROM admin_credentials WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1) as password_plain
      FROM admin_team at
      INNER JOIN profiles p ON p.id = at.user_id
      WHERE at.user_id = ${userId}
    `;

    if (adminData.length === 0) {
      return NextResponse.json(
        { error: "Admin não encontrado" },
        { status: 404 }
      );
    }

    const admin_info = adminData[0];

    // Registrar auditoria
    await sql`
      INSERT INTO audit_logs (actor_id, action, target_id, details, created_at)
      VALUES (${admin.userId}, 'VIEW_CREDENTIALS', ${userId}, 'Super Admin visualizou credenciais', NOW())
    `;

    return NextResponse.json({
      id: admin_info.id,
      user_id: admin_info.user_id,
      email: admin_info.email,
      name: admin_info.name,
      role: admin_info.role,
      password: admin_info.password_plain || "Não disponível"
    });
  } catch (error) {
    console.error("[v0] Error fetching admin credentials:", error);
    return NextResponse.json(
      { error: "Erro ao buscar credenciais" },
      { status: 500 }
    );
  }
}
