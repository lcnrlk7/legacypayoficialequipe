import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Rate limiting em memoria (para producao, usar Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate Limiting - Limita requisicoes por IP
 * @param identifier - IP ou identificador unico
 * @param limit - Numero maximo de requisicoes
 * @param windowMs - Janela de tempo em milissegundos
 */
export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minuto
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

/**
 * Obter IP do cliente
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Rate limit response
 */
export function rateLimitResponse() {
  return NextResponse.json(
    { error: "Muitas requisicoes. Tente novamente em alguns minutos." },
    { status: 429 }
  );
}

/**
 * Verificar se o usuario e membro da equipe (team_members)
 */
export async function isTeamMember(email: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM team_members 
      WHERE email = ${email} AND is_active = true
    `;
    return result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Verificar se o usuario tem permissao de admin (profiles.is_admin OU team_members)
 */
export async function hasAdminAccess(userId: string): Promise<boolean> {
  try {
    // Verificar na profiles
    const profile = await sql`
      SELECT is_admin, email FROM profiles 
      WHERE id = ${userId} AND is_active = true
    `;

    if (profile.length === 0) return false;

    // Se is_admin = true, tem acesso
    if (profile[0].is_admin) return true;

    // Verificar se e membro da equipe
    return await isTeamMember(profile[0].email);
  } catch {
    return false;
  }
}

/**
 * Registrar atividade suspeita
 */
export async function logSuspiciousActivity(
  userId: string | null,
  action: string,
  details: string,
  ip: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (id, user_id, action, details, ip_address, created_at)
      VALUES (
        ${crypto.randomUUID()},
        ${userId},
        ${action},
        ${details},
        ${ip},
        NOW()
      )
    `;
  } catch (error) {
    console.error("[Security] Failed to log suspicious activity:", error);
  }
}

/**
 * Verificar tentativas de login excessivas
 */
export async function checkLoginAttempts(
  email: string,
  ip: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Rate limit por IP
  const ipLimit = rateLimit(`login_ip_${ip}`, 5, 300000); // 5 tentativas por 5 minutos
  if (!ipLimit.allowed) {
    return { allowed: false, reason: "IP bloqueado temporariamente" };
  }

  // Rate limit por email
  const emailLimit = rateLimit(`login_email_${email}`, 3, 300000); // 3 tentativas por 5 minutos
  if (!emailLimit.allowed) {
    return { allowed: false, reason: "Muitas tentativas para este email" };
  }

  return { allowed: true };
}

/**
 * Verificar se o saque e valido (anti-fraude basico)
 */
export async function validateWithdrawal(
  userId: string,
  amount: number,
  pixKey: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // 1. Verificar se o usuario existe e esta ativo
    const user = await sql`
      SELECT id, balance, kyc_status, is_active, is_blocked, created_at
      FROM profiles WHERE id = ${userId}
    `;

    if (user.length === 0 || !user[0].is_active) {
      return { valid: false, reason: "Usuario inativo ou nao encontrado" };
    }

    // 2. SEGURANCA: Verificar se usuario esta bloqueado
    if (user[0].is_blocked) {
      return { valid: false, reason: "Conta bloqueada" };
    }

    // 3. Verificar KYC aprovado
    if (user[0].kyc_status !== "approved") {
      return { valid: false, reason: "KYC nao aprovado" };
    }

    // 4. SEGURANCA: Verificar se conta e muito nova (minimo 24h para sacar)
    const createdAt = new Date(user[0].created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < 24) {
      return { valid: false, reason: "Conta muito recente. Aguarde 24 horas apos cadastro para sacar." };
    }

    // 5. SEGURANCA: Verificar se saldo corresponde a transacoes reais
    const realBalance = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.net_amount ELSE 0 END), 0) as total_deposits,
        COALESCE((SELECT SUM(w.amount + COALESCE(w.fee, 0)) FROM withdrawals w WHERE w.user_id = ${userId} AND w.status IN ('completed', 'processing', 'pending')), 0) as total_withdrawals
      FROM transactions t
      WHERE t.user_id = ${userId}
    `;
    
    const calculatedBalance = Number(realBalance[0]?.total_deposits || 0) - Number(realBalance[0]?.total_withdrawals || 0);
    const currentBalance = Number(user[0].balance);
    
    // Se o saldo atual for maior que o calculado, algo esta errado
    if (currentBalance > calculatedBalance + 1) { // +1 para margem de erro de arredondamento
      await logSuspiciousActivity(userId, "BALANCE_MISMATCH", `Saldo atual: ${currentBalance}, Calculado: ${calculatedBalance}`, "system");
      return { valid: false, reason: "Erro na verificacao de saldo. Entre em contato com o suporte." };
    }

    // 6. Verificar saldo suficiente
    if (Number(user[0].balance) < amount) {
      return { valid: false, reason: "Saldo insuficiente" };
    }

    // 7. Verificar valor minimo e maximo
    if (amount < 20) {
      return { valid: false, reason: "Valor minimo de saque: R$ 20,00" };
    }

    if (amount > 50000) {
      return { valid: false, reason: "Valor maximo de saque: R$ 50.000,00" };
    }

    // 8. Rate limit de saques (maximo 3 por hora)
    const recentWithdrawals = await sql`
      SELECT COUNT(*) as count FROM withdrawals
      WHERE user_id = ${userId}
      AND created_at > NOW() - INTERVAL '1 hour'
    `;

    if (Number(recentWithdrawals[0].count) >= 3) {
      return { valid: false, reason: "Limite de saques por hora atingido" };
    }

    // 9. Verificar se a chave PIX ja foi usada por outro usuario
    const pixKeyUsedByOthers = await sql`
      SELECT user_id FROM withdrawals
      WHERE pix_key = ${pixKey}
      AND user_id != ${userId}
      AND status = 'completed'
      LIMIT 1
    `;

    if (pixKeyUsedByOthers.length > 0) {
      return { valid: false, reason: "Chave PIX ja utilizada por outra conta" };
    }

    return { valid: true };
  } catch (error) {
    console.error("[Security] Withdrawal validation error:", error);
    return { valid: false, reason: "Erro na validacao" };
  }
}

/**
 * Lista de IPs bloqueados (pode ser expandido com banco de dados)
 */
const blockedIPs = new Set<string>();

export function blockIP(ip: string): void {
  blockedIPs.add(ip);
}

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

/**
 * Sanitizar entrada de texto (prevenir XSS basico)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validar formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar CPF (formato basico)
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false; // Todos digitos iguais
  return true;
}

/**
 * Validar chave PIX
 */
export function isValidPixKey(pixKey: string): boolean {
  const cleanKey = pixKey.trim();

  // CPF
  if (/^\d{11}$/.test(cleanKey.replace(/\D/g, ""))) return true;

  // CNPJ
  if (/^\d{14}$/.test(cleanKey.replace(/\D/g, ""))) return true;

  // Email
  if (isValidEmail(cleanKey)) return true;

  // Telefone
  if (/^\+?55?\d{10,11}$/.test(cleanKey.replace(/\D/g, ""))) return true;

  // Chave aleatoria (UUID)
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      cleanKey
    )
  )
    return true;

  return false;
}
