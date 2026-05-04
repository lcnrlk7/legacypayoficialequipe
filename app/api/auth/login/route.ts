import { NextRequest, NextResponse } from "next/server";
import { loginUser, createToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { checkLoginAttempts, getClientIP, logSuspiciousActivity } from "@/lib/security";
import { logLogin } from "@/lib/discord-webhook";
import { detectAttack } from "@/lib/sanitize";
import { logAttack } from "@/lib/attack-logger";

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
    
    // SEGURANCA: Verificar ataques nos campos
    for (const [field, value] of Object.entries({ email, password })) {
      if (typeof value === "string") {
        const attack = detectAttack(value);
        if (attack.detected) {
          await logAttack({
            attackType: attack.attackType!,
            ipAddress: ip,
            userEmail: email,
            payload: value.substring(0, 100),
            endpoint: "/api/auth/login",
            severity: attack.severity || "high",
            blocked: true,
          });
          
          // Bloquear IP para ataques criticos
          if (attack.severity === "critical" || attack.severity === "high") {
            try {
              await sql`
                INSERT INTO blocked_ips (ip_address, reason)
                VALUES (${ip}, ${`${attack.attackType} no login - campo ${field}`})
                ON CONFLICT (ip_address) DO NOTHING
              `;
            } catch {
              // Ignora
            }
          }
          
          return NextResponse.json(
            { error: "Conteúdo não permitido" },
            { status: 400 }
          );
        }
      }
    }
    
    // Verificar se IP esta bloqueado
    const blockedIp = await sql`SELECT id FROM blocked_ips WHERE ip_address = ${ip}`;
    if (blockedIp.length > 0) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }
    
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
      
      // Log para Discord
      logLogin({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        ip: ip,
        userAgent: request.headers.get("user-agent") || undefined,
        isAdmin: user.role === "admin" || user.role === "ceo",
      });
    } catch (logError) {
      console.error("[v0] Error logging successful login:", logError);
    }

    // Atualizar updated_at e last_ip (sem bloquear)
    try {
      await sql`UPDATE profiles SET updated_at = NOW(), last_ip = ${ip} WHERE id = ${user.id}`;
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

    // Cookie HTTPOnly em producao para proteger contra XSS (roubo de cookies)
    const isProduction = process.env.NODE_ENV === "production" && !process.env.VERCEL_URL?.includes('v0.dev');
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: isProduction, // HTTPOnly em producao para seguranca contra XSS
      secure: isProduction,
      sameSite: "strict", // Strict para maior seguranca
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
