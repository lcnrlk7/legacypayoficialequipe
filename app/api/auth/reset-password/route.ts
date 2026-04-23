import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, código e nova senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar token
    const tokens = await sql`
      SELECT * FROM password_reset_tokens 
      WHERE email = ${email} 
        AND code = ${code} 
        AND used = false 
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 }
      );
    }

    // Marcar token como usado
    await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE id = ${tokens[0].id}
    `;

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha do usuário
    const result = await sql`
      UPDATE profiles 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE email = ${email}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso!",
    });
  } catch (error) {
    console.error("[v0] Error in reset password:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
