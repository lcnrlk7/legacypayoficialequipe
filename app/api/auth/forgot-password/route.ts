import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendPasswordResetEmail, generateVerificationCode } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o email existe na tabela profiles
    const users = await sql`
      SELECT id, email, name FROM profiles WHERE email = ${email}
    `;

    if (users.length === 0) {
      // Por segurança, não informamos se o email existe ou não
      return NextResponse.json({
        success: true,
        message: "Se o email estiver cadastrado, você receberá um código de recuperação.",
      });
    }

    const user = users[0];

    // Invalidar tokens anteriores
    await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE email = ${email} AND used = false
    `;

    // Gerar novo código
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Salvar token no banco
    await sql`
      INSERT INTO password_reset_tokens (email, code, expires_at)
      VALUES (${email}, ${code}, ${expiresAt.toISOString()})
    `;

    // Enviar email usando a funcao padronizada
    const sent = await sendPasswordResetEmail(email, code, user.name || undefined);
    
    if (!sent) {
      console.error("[Forgot Password] Erro ao enviar email para:", email);
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código de recuperação enviado para o seu email.",
    });
  } catch (error) {
    console.error("[v0] Error in forgot password:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
