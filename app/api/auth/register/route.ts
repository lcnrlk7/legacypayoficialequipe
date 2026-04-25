import { NextRequest, NextResponse } from "next/server";
import { registerUser, createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, cpf, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se CPF já existe
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "");
      const existingCpf = await sql`
        SELECT id FROM profiles WHERE cpf_cnpj = ${cleanCpf}
      `;

      if (existingCpf.length > 0) {
        return NextResponse.json(
          { error: "CPF já cadastrado" },
          { status: 400 }
        );
      }
    }

    // Register user
    const { user, error } = await registerUser(
      email, 
      password, 
      name,
      phone?.replace(/\D/g, ""),
      cpf?.replace(/\D/g, ""),
      cpf ? 'cpf' : undefined
    );

    if (error || !user) {
      return NextResponse.json(
        { error: error || "Erro ao criar conta" },
        { status: 400 }
      );
    }

    // Create token
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      kyc_status: user.kyc_status,
    });

    // Registrar log de cadastro
    try {
      await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, new_value, created_at)
        VALUES (${user.id}, 'REGISTER', 'auth', ${JSON.stringify({ email, name })}, NOW())
      `;
    } catch (logError) {
      console.error("[v0] Error logging registration:", logError);
    }

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error("[v0] Error sending welcome email:", emailError);
    }

    // Criar response com token no body E no cookie
    const response = NextResponse.json({
      success: true,
      token, // Retornar token para o cliente salvar
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Definir cookie NÃO httpOnly para funcionar no v0
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[v0] Error in register:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
