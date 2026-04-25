import { sql } from "@/lib/db";

export type AuditActionType =
  | "login"
  | "logout"
  | "transaction"
  | "withdrawal"
  | "deposit"
  | "pix_key"
  | "profile_update"
  | "kyc"
  | "api_key"
  | "webhook"
  | "admin_action"
  | "reward"
  | "other";

interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  action: string;
  actionType: AuditActionType;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, old_value, new_value, ip_address, user_agent)
      VALUES (
        ${params.userId || null},
        ${params.action},
        ${params.actionType},
        ${JSON.stringify({ email: params.userEmail, name: params.userName, description: params.description })},
        ${JSON.stringify(params.metadata || {})},
        ${params.ipAddress || null},
        ${params.userAgent || null}
      )
    `;
    return true;
  } catch (error) {
    console.error("[v0] Error creating audit log:", error);
    return false;
  }
}

// Helper para extrair IP do request
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || null;
}

// Helper para extrair User Agent
export function getUserAgent(request: Request): string | null {
  return request.headers.get("user-agent") || null;
}
