import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { checkLoginAttempts, getClientIP, logSuspiciousActivity } from "@/lib/security";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha sao obrigatorios" },
        { status: 400 }
      );
    }

    // SEGURANCA: Rate limiting de login
    const ip = await getClientIP();
    const loginCheck = await checkLoginAttempts(email, ip);
    
    if (!loginCheck.allowed) {
      await logSuspiciousActivity(null, "LOGIN_BLOCKED", `IP: ${ip}, Email: ${email}, Reason: ${loginCheck.reason}`, ip);
      return NextResponse.json(
        { error: loginCheck.reason || "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const { user, error } = await loginUser(email, password);

    if (error || !user) {
      // Registrar tentativa de login falha (sem bloquear)
      try {
        await sql`
          INSERT INTO audit_logs (action, entity_type, new_value, created_at)
          VALUES ('LOGIN_FAILED', 'auth', ${JSON.stringify({ email, error })}, NOW())
        `;
      } catch (logError) {
        console.error("[v0] Error logging failed login:", logError);
      }

      return NextResponse.json(
        { error: error || "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken(user);

    // Registrar login bem-sucedido (sem bloquear)
    try {
      await sql`
        INSERT INTO audit_logs (user_id, action, entity_type, new_value, created_at)
        VALUES (${user.id}, 'LOGIN', 'auth', ${JSON.stringify({ email: user.email })}, NOW())
      `;
    } catch (logError) {
      console.error("[v0] Error logging successful login:", logError);
    }

    // Atualizar updated_at (sem bloquear)
    try {
      await sql`UPDATE profiles SET updated_at = NOW() WHERE id = ${user.id}`;
    } catch (updateError) {
      console.error("[v0] Error updating profile:", updateError);
    }

    // Criar response com token no body E no cookie (não httpOnly para funcionar no v0)
    const response = NextResponse.json({
      success: true,
      token, // Retornar token para o cliente salvar
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        kyc_status: user.kyc_status,
      },
    });

    // Definir cookie NÃO httpOnly para funcionar no ambiente de preview do v0
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: false, // IMPORTANTE: false para funcionar no v0
      secure: false,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[v0] Error in login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
