import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

const AVAILABLE_ROLES = ["superadmin", "admin", "manager", "finance", "attendant", "ceo"];

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    // Buscar todas as roles com permissões
    const roles = await sql`
      SELECT id, role, permissions, description, created_at
      FROM admin_roles
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      roles: roles || [],
      availableRoles: AVAILABLE_ROLES
    });
  } catch (error) {
    console.error("[v0] Error fetching roles:", error);
    return NextResponse.json(
      { error: "Erro ao buscar roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
        { error: "Apenas Super Admin pode criar roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, permissions, description } = body;

    if (!role || !permissions) {
      return NextResponse.json(
        { error: "role e permissions são obrigatórios" },
        { status: 400 }
      );
    }

    const newRole = await sql`
      INSERT INTO admin_roles (role, permissions, description, created_at)
      VALUES (${role}, ${JSON.stringify(permissions)}, ${description || null}, NOW())
      RETURNING *
    `;

    // Registrar auditoria
    await sql`
      INSERT INTO audit_logs (actor_id, action, details, created_at)
      VALUES (${admin.userId}, 'CREATE_ROLE', ${`Criou role: ${role}`}, NOW())
    `;

    return NextResponse.json(newRole[0]);
  } catch (error) {
    console.error("[v0] Error creating role:", error);
    return NextResponse.json(
      { error: "Erro ao criar role" },
      { status: 500 }
    );
  }
}
