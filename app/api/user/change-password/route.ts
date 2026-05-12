import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validacoes
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Buscar usuario com senha atual
    const users = await sql`
      SELECT id, password_hash FROM profiles WHERE id = ${user.id}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const profile = users[0];

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, profile.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await sql`
      UPDATE profiles 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // Log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, new_value, created_at)
      VALUES (${user.id}, 'PASSWORD_CHANGED', 'auth', '{"via": "dashboard"}', NOW())
    `;

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso!",
    });
  } catch (error) {
    console.error("[Change Password] Error:", error);
    return NextResponse.json(
      { error: "Erro ao alterar senha" },
      { status: 500 }
    );
  }
}
